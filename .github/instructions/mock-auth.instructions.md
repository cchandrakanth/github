---
description: "Use when implementing or testing authentication, OAuth flows, session handling, or role-based access control. Covers mock auth patterns for multi-role testing."
applyTo: "**/{auth,session,login,oauth,mock-auth}*/**/*.{ts,js,py,tsx,jsx}"
---

# Mock Auth & Multi-Role Testing Standards

## Environment Configuration

```env
# .env.test or .env.local (NEVER .env.production)
MOCK_AUTH_ENABLED=true
MOCK_AUTH_DEFAULT_USER=user-01
MOCK_AUTH_BYPASS_MFA=true
```

## Production Safety — MANDATORY

Mock auth must **never activate in production**. Every entry point must enforce:

```typescript
const isMockAuth =
  process.env.MOCK_AUTH_ENABLED === 'true' &&
  process.env.NODE_ENV !== 'production';
```

- Production builds must tree-shake or exclude mock auth modules entirely
- Mock data files should use `@mock.test` email domain only
- Mock tokens must be clearly prefixed (`mock_token_`, `mock_refresh_`)
- CI pipelines must fail if mock auth code is detected in production bundles

## Mock Auth Architecture

```
__tests__/
  helpers/
    mock-auth.ts         # Session/token creation helpers
    mock-users-data.ts   # Raw mock user registry (50 users)
lib/
  auth/
    mock-guard.ts        # Production safety guard
    session.ts           # Real session module (mockable in tests)
```

## Rules

1. **Guard first**: Always call `assertMockAuthAllowed()` before using any mock auth functions
2. **Import isolation**: Mock auth helpers exist ONLY in `__tests__/helpers/` — never in `lib/` or `app/`
3. **No real credentials**: Mock data never contains real emails, phone numbers, or API keys
4. **Role matrix coverage**: Every protected route must test at least: allowed role, denied role, unauthenticated, and edge case (expired/banned)
5. **Provider diversity**: Test critical flows with at least 2 different OAuth providers
6. **Deterministic data**: Mock users have fixed IDs (`user-01` through `user-50`) for reproducible tests

## When to Use Mock Auth

| Scenario | Use Mock Auth? |
|----------|---------------|
| Unit testing a utility function | No — no auth needed |
| Integration testing a protected API route | Yes — mock the session |
| E2E testing login flows | Yes — mock OAuth provider responses |
| E2E testing in staging with real users | No — use test accounts with real provider |
| Load testing | Yes — mock auth to isolate performance from provider latency |
| Manual local development | Optional — set `MOCK_AUTH_DEFAULT_USER` for auto-login |

## See Also

- Mock user registry: `skills/testing/references/mock-users.md`
- Test patterns: `skills/testing/references/patterns.md`
- OWASP checklist: `skills/security-review/references/owasp-checklist.md`
