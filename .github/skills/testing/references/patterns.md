# Test Patterns Reference

Customize these examples for your project's language and test runner after running `/onboard`.

## Unit Test — Pure Function (TypeScript/Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '@/lib/utils/pricing';

describe('calculateTotal', () => {
  it('computes total with tax', () => {
    const result = calculateTotal(100, 0.08);
    expect(result).toBe(108);
  });

  it('handles zero amount', () => {
    const result = calculateTotal(0, 0.08);
    expect(result).toBe(0);
  });
});
```

## Integration Test — API Route (TypeScript/Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock auth session
vi.mock('@/lib/auth/session', () => ({
  verifySession: vi.fn().mockResolvedValue({ uid: 'test-user' }),
}));

describe('GET /api/resource', () => {
  it('returns 401 without session', async () => {
    const { verifySession } = await import('@/lib/auth/session');
    vi.mocked(verifySession).mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/resource/route');
    const response = await GET(new Request('http://localhost/api/resource'));
    expect(response.status).toBe(401);
  });
});
```

## E2E Test — Playwright

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays main content', async ({ page }) => {
    await page.goto('/feature');
    await expect(page.getByText('Feature Title')).toBeVisible();
  });

  test('form submission works', async ({ page }) => {
    await page.goto('/feature');
    await page.fill('[name="field"]', 'value');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Component Test — React Testing Library

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MyComponent } from '@/components/feature/MyComponent';

describe('MyComponent', () => {
  it('calls onSubmit when form submitted', () => {
    const onSubmit = vi.fn();
    render(<MyComponent onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

## Python Unit Test (Pytest)

```python
import pytest
from app.utils.pricing import calculate_total

def test_calculate_total_with_tax():
    assert calculate_total(100, 0.08) == 108

def test_calculate_total_zero():
    assert calculate_total(0, 0.08) == 0
```

---

## Mock Auth Testing Patterns

These patterns activate only when `MOCK_AUTH_ENABLED=true` and `NODE_ENV !== 'production'`.
See [mock-users.md](./mock-users.md) for the full 50-user registry.

### Mock Auth Provider Setup (TypeScript)

```typescript
// __tests__/helpers/mock-auth.ts
import { MOCK_USERS } from './mock-users-data';

export type Role = 'super-admin' | 'admin' | 'billing-admin' | 'owner'
  | 'manager' | 'moderator' | 'editor' | 'viewer' | 'support' | 'guest';

export type OAuthProvider = 'google' | 'github' | 'phone' | 'apple'
  | 'microsoft' | 'facebook' | 'anonymous';

export interface MockUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  provider: OAuthProvider;
  providerId: string;
  avatar: string | null;
  verified: boolean;
  mfaEnabled: boolean;
  status: 'active' | 'suspended' | 'deleted' | 'pending';
  orgId: string | null;
  createdAt: string;
  lastLoginAt: string;
  metadata: Record<string, unknown>;
}

export interface MockSession {
  uid: string;
  role: Role;
  provider: OAuthProvider;
  email: string | null;
  phone: string | null;
  verified: boolean;
  mfaVerified: boolean;
  orgId: string | null;
  expiresAt: number;
}

/** Get a mock user by ID */
export function getMockUser(id: string): MockUser {
  const user = MOCK_USERS.find(u => u.id === id);
  if (!user) throw new Error(`Mock user ${id} not found`);
  return user;
}

/** Get all mock users with a specific role */
export function getMockUsersByRole(role: Role): MockUser[] {
  return MOCK_USERS.filter(u => u.role === role);
}

/** Get all mock users for a specific provider */
export function getMockUsersByProvider(provider: OAuthProvider): MockUser[] {
  return MOCK_USERS.filter(u => u.provider === provider);
}

/** Create a mock session from a mock user */
export function createMockSession(userId: string): MockSession {
  const user = getMockUser(userId);
  return {
    uid: user.id,
    role: user.role,
    provider: user.provider,
    email: user.email,
    phone: user.phone,
    verified: user.verified,
    mfaVerified: user.mfaEnabled,
    orgId: user.orgId,
    expiresAt: Date.now() + 3600_000, // 1 hour
  };
}

/** Create an expired mock session (for testing token expiry) */
export function createExpiredMockSession(userId: string): MockSession {
  const session = createMockSession(userId);
  return { ...session, expiresAt: Date.now() - 1000 };
}

/** Create a mock OAuth token response for provider-specific testing */
export function createMockOAuthToken(userId: string) {
  const user = getMockUser(userId);
  return {
    access_token: `mock_token_${user.id}_${user.provider}`,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: `mock_refresh_${user.id}`,
    scope: 'openid profile email',
    id_token: `mock_id_token_${user.id}`,
    provider: user.provider,
  };
}
```

### Guard: Production Safety Check

```typescript
// lib/auth/mock-guard.ts
// This module must be imported BEFORE any mock auth usage

export function isMockAuthAllowed(): boolean {
  return (
    process.env.MOCK_AUTH_ENABLED === 'true' &&
    process.env.NODE_ENV !== 'production'
  );
}

export function assertMockAuthAllowed(): void {
  if (!isMockAuthAllowed()) {
    throw new Error('Mock auth is not allowed in this environment');
  }
}
```

### Role-Based Access Testing (Vitest)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession, getMockUsersByRole } from '../helpers/mock-auth';

// Mock the session verification module
vi.mock('@/lib/auth/session', () => ({
  verifySession: vi.fn(),
}));

describe('GET /api/admin/users — role-based access', () => {
  const { verifySession } = vi.mocked(await import('@/lib/auth/session'));
  const { GET } = await import('@/app/api/admin/users/route');

  const makeRequest = () => new Request('http://localhost/api/admin/users');

  // Roles that SHOULD have access
  it.each([
    ['super-admin', 'user-01'],
    ['admin', 'user-03'],
  ])('allows %s (user %s) to access admin endpoint', async (role, userId) => {
    verifySession.mockResolvedValueOnce(createMockSession(userId));
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
  });

  // Roles that SHOULD NOT have access
  it.each([
    ['editor', 'user-26'],
    ['viewer', 'user-34'],
    ['guest', 'user-46'],
    ['support', 'user-42'],
    ['billing-admin', 'user-08'],
  ])('denies %s (user %s) from admin endpoint', async (role, userId) => {
    verifySession.mockResolvedValueOnce(createMockSession(userId));
    const response = await GET(makeRequest());
    expect(response.status).toBe(403);
  });

  it('returns 401 for unauthenticated request', async () => {
    verifySession.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});
```

### OAuth Provider Flow Testing (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createMockOAuthToken, getMockUsersByProvider } from '../helpers/mock-auth';

describe('OAuth callback handling', () => {
  it.each([
    ['google', 'user-01'],
    ['github', 'user-02'],
    ['phone', 'user-06'],
    ['apple', 'user-07'],
    ['microsoft', 'user-04'],
    ['facebook', 'user-15'],
  ])('processes %s OAuth callback for user %s', async (provider, userId) => {
    const token = createMockOAuthToken(userId);
    expect(token.provider).toBe(provider);
    expect(token.access_token).toContain(userId);

    // Call your OAuth callback handler with the mock token
    // const result = await handleOAuthCallback(provider, token);
    // expect(result.success).toBe(true);
  });
});
```

### Edge Case Testing — Suspended/Deleted/Expired Users

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createMockSession, createExpiredMockSession } from '../helpers/mock-auth';

describe('Auth edge cases', () => {
  it('rejects suspended user (user-49)', async () => {
    const session = createMockSession('user-49');
    // Your auth middleware should check user.status
    // expect(response.status).toBe(403);
  });

  it('rejects deleted account (user-50)', async () => {
    const session = createMockSession('user-50');
    // expect(response.status).toBe(401);
  });

  it('rejects expired session (user-48)', async () => {
    const session = createExpiredMockSession('user-48');
    expect(session.expiresAt).toBeLessThan(Date.now());
    // expect(response.status).toBe(401);
  });

  it('requires MFA when user has it enabled but not verified', async () => {
    const session = createMockSession('user-05'); // admin, mfa disabled
    expect(session.mfaVerified).toBe(false);
    // If your app enforces MFA for admins, this should redirect to MFA
  });

  it('handles unverified email', async () => {
    const session = createMockSession('user-21'); // unverified manager
    expect(session.verified).toBe(false);
    // Routes requiring verification should return 403 or redirect
  });
});
```

### E2E — Multi-Role Flow (Playwright)

```typescript
import { test, expect } from '@playwright/test';

// Only run mock auth tests when enabled
const isMockAuth = process.env.MOCK_AUTH_ENABLED === 'true';
const describeIf = isMockAuth ? test.describe : test.describe.skip;

describeIf('Dashboard access by role', () => {
  const roleCases = [
    { userId: 'user-01', role: 'super-admin', canSeeAdminPanel: true },
    { userId: 'user-03', role: 'admin', canSeeAdminPanel: true },
    { userId: 'user-26', role: 'editor', canSeeAdminPanel: false },
    { userId: 'user-34', role: 'viewer', canSeeAdminPanel: false },
  ];

  for (const { userId, role, canSeeAdminPanel } of roleCases) {
    test(`${role} (${userId}) dashboard access`, async ({ page }) => {
      // Set mock user via cookie/header (project-specific)
      await page.addInitScript((id) => {
        window.__MOCK_USER_ID__ = id;
      }, userId);

      await page.goto('/dashboard');
      await expect(page.getByText('Dashboard')).toBeVisible();

      if (canSeeAdminPanel) {
        await expect(page.getByText('Admin Panel')).toBeVisible();
      } else {
        await expect(page.getByText('Admin Panel')).not.toBeVisible();
      }
    });
  }
});
```

### Python — Role-Based Access Testing (Pytest)

```python
import pytest
from tests.helpers.mock_auth import create_mock_session, get_mock_users_by_role

ADMIN_USERS = get_mock_users_by_role("admin")
VIEWER_USERS = get_mock_users_by_role("viewer")

@pytest.mark.parametrize("user", ADMIN_USERS, ids=lambda u: u["id"])
def test_admin_endpoint_allows_admins(client, user):
    session = create_mock_session(user["id"])
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {session['token']}"})
    assert response.status_code == 200

@pytest.mark.parametrize("user", VIEWER_USERS, ids=lambda u: u["id"])
def test_admin_endpoint_denies_viewers(client, user):
    session = create_mock_session(user["id"])
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {session['token']}"})
    assert response.status_code == 403
```
