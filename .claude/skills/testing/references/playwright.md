# Playwright E2E Testing

Writing and running Playwright tests against spec acceptance criteria. Applies when `testing.e2eFramework` in `project-config.json` is Playwright.

**Scope boundary:** this reference covers *authoring committed test files*. For driving a browser interactively as an agent — snapshots, element refs, ad-hoc exploration — load the `playwright-cli` skill instead. For locator selection, see [locators.md](./locators.md).

## Install

```bash
npm init playwright@latest          # scaffolds config, example tests, CI workflow
npx playwright install --with-deps  # browsers + OS deps (this is the step CI forgets)
```

## Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,        // fails the build if test.only was committed
  retries: process.env.CI ? 2 : 0,     // retry in CI only — retries locally hide flake
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',           // full timeline for exactly the runs that failed
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'mobile',   use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

`trace: 'on-first-retry'` is the highest-value line in the file — it costs nothing on green runs and gives you a full DOM/network/console timeline for every failure. Open one with `npx playwright show-trace trace.zip`.

## Test Structure from a Spec

Each test maps to one AC in `specs/{feature}/test.yml`. Reference the AC id in the title so a failure names the requirement it broke.

```typescript
// e2e/invoices.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Invoice list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/invoices');
  });

  test('AC-01: displays invoices for the current org', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(4);   // 1 header + 3 data
  });

  test('AC-02: filters by invoice number', async ({ page }) => {
    await page.getByLabel('Search invoices').fill('INV-1042');
    await expect(page.getByRole('row').filter({ hasText: 'INV-1042' })).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(2);
  });

  test('AC-03: empty state when no invoices match', async ({ page }) => {
    await page.getByLabel('Search invoices').fill('NOPE-0000');
    await expect(page.getByText('No invoices found')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'INV-' })).toHaveCount(0);
  });
});
```

Use `test.step` to make long flows legible in the trace and HTML report:

```typescript
test('AC-07: completes checkout', async ({ page }) => {
  await test.step('add item to cart', async () => {
    await page.getByRole('button', { name: 'Add to cart' }).click();
  });
  await test.step('submit payment', async () => {
    await page.getByRole('button', { name: 'Pay now' }).click();
  });
  await expect(page.getByText('Order confirmed')).toBeVisible();
});
```

## Authentication — sign in once, reuse everywhere

Signing in through the UI in `beforeEach` is the single biggest source of slow, flaky suites. Do it once in a setup project and reuse the storage state.

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
```

```typescript
// playwright.config.ts — projects
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
],
```

Add `playwright/.auth/` to `.gitignore` — it holds live session cookies.

For multi-role coverage, write one storage-state file per role and select it per describe block:

```typescript
test.describe('admin-only routes', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('AC-11: admin can open the user list', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });
});

test.describe('viewer restrictions', () => {
  test.use({ storageState: 'playwright/.auth/viewer.json' });

  test('AC-12: viewer is denied the user list', async ({ page }) => {
    const response = await page.goto('/admin/users');
    expect(response?.status()).toBe(403);
  });
});
```

This pairs with the mock auth system — see [mock-users.md](./mock-users.md) for the 50-user registry and which user id maps to which role.

## Fixtures

Custom fixtures beat `beforeEach` helpers: they're typed, lazy (only constructed when a test asks for one), and compose.

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { InvoiceListPage } from './pages/invoice-list.page';

export const test = base.extend<{ invoices: InvoiceListPage }>({
  invoices: async ({ page }, use) => {
    const invoices = new InvoiceListPage(page);
    await invoices.goto();
    await use(invoices);
  },
});

export { expect } from '@playwright/test';
```

```typescript
import { test, expect } from './fixtures';

test('AC-04: downloads an invoice', async ({ invoices, page }) => {
  const download = page.waitForEvent('download');
  await invoices.download('INV-1042');
  expect((await download).suggestedFilename()).toBe('INV-1042.pdf');
});
```

## Network Control

Stub third-party and slow dependencies; let your own API run for real unless the test is specifically about a failure path.

```typescript
// deterministic fixture data
await page.route('**/api/invoices', route =>
  route.fulfill({ json: [{ id: 'INV-1042', total: 4200 }] })
);

// simulate a server error to test the error state
await page.route('**/api/invoices', route => route.fulfill({ status: 500 }));

// block third-party noise — analytics, ads, session replay
await page.route(/analytics|doubleclick|hotjar/, route => route.abort());

// assert a request was made with the right payload
const request = page.waitForRequest(r =>
  r.url().includes('/api/invoices') && r.method() === 'POST'
);
await page.getByRole('button', { name: 'Create invoice' }).click();
expect((await request).postDataJSON()).toMatchObject({ total: 4200 });
```

## Running

```bash
npx playwright test                          # everything
npx playwright test invoices.spec.ts         # one file
npx playwright test -g "AC-02"               # by title — handy for AC-tagged tests
npx playwright test --project=chromium       # one browser
npx playwright test --ui                     # watch mode + time-travel + locator picker
npx playwright test --debug                  # step through with Inspector
npx playwright test --headed                 # watch it run
npx playwright show-report                   # last HTML report
npx playwright test --repeat-each=5          # flake hunt
npx playwright test --last-failed            # rerun only what failed
```

## Flake Triage

Reproduce first, then classify. `--repeat-each=10 --workers=1` reproduces most timing flake; if it only fails with parallel workers, it's shared state.

| Symptom | Cause | Fix |
|---|---|---|
| Passes alone, fails in a suite | Shared DB rows / storage between tests | Unique data per test (`INV-${test.info().workerIndex}`) |
| Fails only in CI | Slower machine, missing browser deps, no seed data | `--with-deps`, raise `expect` timeout, verify fixtures |
| Fails ~1 in 10 | Racing a render or animation | Web-first assertions; never `waitForTimeout` |
| "strict mode violation" | Locator matches 2+ elements | Narrow with `.filter()` — see [locators.md](./locators.md) |
| Element detached mid-click | Re-render between resolve and act | Assert stable state first, then act |
| Timeouts after a deploy | Locator tied to changed markup | Move the locator up the ladder |

Never fix flake with a longer sleep. If a test must be quarantined, mark it and record why:

```typescript
test.fixme('AC-09: exports to CSV', async ({ page }) => {
  // Quarantined 2026-09-08, #412 — export worker races the assertion in CI
});
```

Then add an entry to `knowledge-base/automation-test-fixes/` per the repo's write-after rule, with `fix_type: workaround` so the debt stays visible.

## CI

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 20, cache: npm }
- run: npm ci
- run: npx playwright install --with-deps
- run: npx playwright test
- uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

Uploading the report on failure is what makes a red CI run diagnosable — without it you get a stack trace and nothing else.

## Checklist

- [ ] Every test title names the AC it covers
- [ ] Auth via `storageState`, not a UI login in `beforeEach`
- [ ] `trace: 'on-first-retry'` enabled
- [ ] No `waitForTimeout` anywhere in the suite
- [ ] Assertions are web-first (`await expect(locator)`), not resolved values
- [ ] Tests create their own data and don't depend on execution order
- [ ] `forbidOnly` set so a stray `test.only` can't green the build
- [ ] Report artifact uploaded in CI
