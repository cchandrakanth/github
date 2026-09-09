# Locator Strategy & Best Practices

How to find and write locators that survive refactors. Applies when `testing.e2eFramework` or `testing.componentFramework` in `project-config.json` is Playwright; the priority ladder and anti-patterns carry over to Cypress and Testing Library with different syntax.

A locator is a **contract** between the test and the UI. A good locator breaks when the behavior changes and survives when only the markup changes. A bad locator does the opposite — it breaks on a CSS refactor and silently keeps passing after a feature regresses.

## The Priority Ladder

Always pick the **highest rung that works**. Going lower is a decision you should be able to justify.

| # | Locator | Use for |
|---|---------|---------|
| 1 | `getByRole(role, { name })` | Anything interactive or semantic — buttons, links, inputs, headings, dialogs, tabs |
| 2 | `getByLabel(text)` | Form controls with a `<label>`, `aria-label`, or `aria-labelledby` |
| 3 | `getByPlaceholder(text)` | Inputs with no label (fix the missing label if you can) |
| 4 | `getByText(text)` | Non-interactive copy — paragraphs, list items, status messages |
| 5 | `getByAltText` / `getByTitle` | Images, `<title>` elements, icon-only affordances |
| 6 | `getByTestId(id)` | Explicit contract when nothing above identifies the element |
| 7 | CSS / XPath | Last resort — requires a comment explaining why |

Rungs 1–5 assert something a **user can perceive**, so they double as accessibility checks: if `getByRole('button', { name: 'Save' })` can't find your button, a screen-reader user can't find it either. That's the main reason to start at the top.

```typescript
// Rung 1 — role + accessible name
await page.getByRole('button', { name: 'Save changes' }).click();
await page.getByRole('link', { name: 'Billing' }).click();
await page.getByRole('heading', { name: 'Invoices', level: 2 }).waitFor();

// Rung 2 — label
await page.getByLabel('Email address').fill('user@mock.test');
await page.getByLabel('Remember me').check();

// Rung 4 — visible copy, exact match to avoid substring collisions
await expect(page.getByText('Payment received', { exact: true })).toBeVisible();

// Rung 6 — explicit contract
await page.getByTestId('invoice-row-total').click();
```

## Finding a Locator

Four ways, cheapest first.

**1. `npx playwright codegen <url>`** — record clicks in a browser and it writes tests using the ladder above. Best starting point for an unfamiliar page. Add `--test-id-attribute=data-qa` if the project uses a non-default test-id attribute.

**2. UI mode: `npx playwright test --ui`** — has a **Pick locator** button. Hover any element and it shows the locator Playwright would generate, with live match highlighting. Also lets you edit the locator and see what it matches in real time.

**3. `page.pause()` mid-test** — opens the Inspector against the live, authenticated, mid-flow page state. Use this when the element only exists deep inside a flow that codegen can't reach.

```typescript
test('checkout', async ({ page }) => {
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.pause();  // Inspector opens here — pick locators against real state
});
```

**4. The `playwright-cli` skill** — for agent-driven exploration, `playwright-cli snapshot` returns an accessibility tree with element refs, and `playwright-cli eval "el => el.getAttribute('data-testid')" e7` reveals attributes the snapshot omits. See `skills/playwright-cli/references/element-attributes.md`.

### Verifying a candidate

Before committing a locator, confirm it resolves to exactly one element. Playwright runs in **strict mode** — a locator matching 2+ elements throws rather than silently picking the first:

```bash
npx playwright test --debug          # step through, watch each locator highlight
```

```typescript
await expect(page.getByRole('listitem')).toHaveCount(3);   // assert the count you expect
console.log(await page.getByRole('button').allTextContents());  // see everything that matches
```

## Narrowing: filter, chain, scope

When a locator matches too much, **narrow it** — don't fall back to CSS or `.nth()`.

```typescript
// Scope to a container first — the single most useful technique
const row = page.getByRole('row').filter({ hasText: 'INV-1042' });
await row.getByRole('button', { name: 'Download' }).click();

// filter by a descendant locator
await page.getByRole('listitem')
  .filter({ has: page.getByRole('img', { name: 'Verified' }) })
  .click();

// exclude
await page.getByRole('row').filter({ hasNotText: 'Archived' });

// combine conditions
await page.getByRole('button').and(page.getByTitle('Submit')).click();

// either/or — useful for A/B or loading states
await expect(
  page.getByText('Welcome back').or(page.getByText('Create account'))
).toBeVisible();

// re-usable scope
const dialog = page.getByRole('dialog', { name: 'Confirm deletion' });
await dialog.getByRole('button', { name: 'Delete' }).click();
```

Prefer `.filter({ hasText })` over `.nth(2)`. An index encodes today's ordering; a filter encodes intent, and it fails loudly when the data changes instead of quietly acting on the wrong row.

## Test IDs

When you do reach rung 6, make it deliberate.

- **Name by meaning, not position or style** — `checkout-submit`, not `btn-blue-2` or `third-button`.
- **Put it on the element you act on**, not a wrapper — a testid on a `<div>` wrapping a `<button>` produces click coordinates that can miss.
- **Never reuse an id for two different things.** Strict mode will catch it, but only once a second one appears.
- Configure a non-default attribute once, globally:

```typescript
// playwright.config.ts
export default defineConfig({
  use: { testIdAttribute: 'data-qa' },   // default is data-testid
});
```

- Strip test ids from production builds if bundle size matters, but **keep them in the environment the tests run against** — stripping them in the staging build is a common cause of "passes locally, fails in CI".

## Anti-Patterns

| Anti-pattern | Why it breaks | Instead |
|---|---|---|
| `page.locator('.btn-primary')` | Styling class — dies on any CSS refactor or utility-class change | `getByRole('button', { name })` |
| `page.locator('div > div:nth-child(3) span')` | Encodes DOM shape; one wrapper `<div>` breaks it | Scope to a container, then `getByRole` |
| `page.locator('//div[@id="app"]/div[2]')` | XPath positional chains are the most brittle form of all | Same as above |
| `.nth(0)` / `.first()` on unordered data | Silently targets the wrong item when ordering changes | `.filter({ hasText: '<identifier>' })` |
| `getByText('Save')` for a button | Matches any element with that text, incl. tooltips | `getByRole('button', { name: 'Save' })` |
| Locators built from user-visible copy in an i18n app | Breaks when copy or locale changes | `getByRole` with an aria-label key, or `getByTestId` |
| `page.$('...')` / `page.$$('...')` | Legacy ElementHandle API — no auto-waiting, no strictness | `page.locator(...)` / `getBy*` |
| Generated ids — `#mui-4821`, `#react-aria-3` | Regenerate on every render | `getByRole` or a stable `data-testid` |

## Waiting: let the locator do it

Locators auto-wait. Web-first assertions auto-retry. Almost every explicit wait in a Playwright suite is a bug or a workaround.

```typescript
// ❌ arbitrary sleep — slow when it passes, flaky when it doesn't
await page.waitForTimeout(3000);
await page.getByRole('button', { name: 'Save' }).click();

// ✅ auto-waits for attached + visible + stable + enabled
await page.getByRole('button', { name: 'Save' }).click();

// ❌ resolves once, never retries — races the render
expect(await page.getByTestId('total').textContent()).toBe('$42.00');

// ✅ retries until it matches or times out
await expect(page.getByTestId('total')).toHaveText('$42.00');
```

Asserting absence needs care — `toBeVisible()` waits for appearance, so the negative form must be chosen for what you actually mean:

```typescript
await expect(page.getByRole('alert')).toHaveCount(0);   // not in the DOM at all
await expect(page.getByRole('alert')).toBeHidden();     // present but not visible (or detached)
```

If a wait is genuinely unavoidable, wait on a **condition**, never a duration:

```typescript
await page.waitForURL('**/dashboard');
await page.waitForResponse(r => r.url().includes('/api/invoices') && r.ok());
await expect(page.getByRole('progressbar')).toHaveCount(0);   // spinner gone
```

## Page Objects

Once a locator appears in three or more tests, give it one home. Expose **locators and intent**, not raw selector strings — that way a markup change is a one-line fix.

```typescript
// e2e/pages/invoice-list.page.ts
import type { Page, Locator } from '@playwright/test';

export class InvoiceListPage {
  readonly newInvoice: Locator;
  readonly search: Locator;

  constructor(private readonly page: Page) {
    this.newInvoice = page.getByRole('button', { name: 'New invoice' });
    this.search = page.getByLabel('Search invoices');
  }

  async goto() {
    await this.page.goto('/invoices');
  }

  row(invoiceNumber: string): Locator {
    return this.page.getByRole('row').filter({ hasText: invoiceNumber });
  }

  async download(invoiceNumber: string) {
    await this.row(invoiceNumber).getByRole('button', { name: 'Download' }).click();
  }
}
```

Keep assertions in the test, not the page object — the page object says *how to reach* things, the test says *what should be true*.

## Checklist

Before a test lands:

- [ ] Every locator sits as high on the ladder as the markup allows
- [ ] No locator depends on a CSS class, DOM position, or generated id
- [ ] Repeated elements are narrowed with `.filter()`, not `.nth()`
- [ ] No `waitForTimeout` — waits are on conditions or handled by auto-waiting
- [ ] Assertions use retrying `expect(locator)` form, not resolved values
- [ ] Locators used 3+ times live in a page object
- [ ] The suite passes with `--repeat-each=3` (see `playwright.md` for flake triage)
