---
name: testing
description: "Run and create automated tests. Use when writing unit tests, integration tests, e2e tests, or executing test suites against spec acceptance criteria."
argument-hint: "Feature name or spec path to test"
---

# Testing Skill

## When to Use

- Writing tests for a new feature from `test.yml` spec
- Running existing test suites
- Validating acceptance criteria after implementation
- Debugging failing tests

## Procedure

### Writing Tests from Spec

1. Read `specs/{feature}/test.yml`
2. Read `specs/{feature}/spec.md` for context
3. For each test case in `test.yml`:
   - Create the test file at the specified path
   - Map to the referenced AC
   - Include edge cases
4. Run tests using the project's configured test runner

### Running All Tests

Check `.github/copilot-instructions.md` for the project's test runner, then:
- Run all tests
- Run unit tests only
- Run e2e tests only
- Use verbose reporter for detailed output

### Validating a Feature

1. Read spec to get list of ACs
2. Run the feature's test files
3. Map pass/fail to each AC
4. Report coverage per AC

## Mock Auth Testing (Multi-Role / OAuth)

When `MOCK_AUTH_ENABLED=true` is set in `.env` (and `NODE_ENV !== 'production'`), the mock auth system activates. This allows testing features across 50 predefined users, 10 roles, and 6 OAuth providers without real credentials.

### Setup

1. Set `MOCK_AUTH_ENABLED=true` in `.env.test` or `.env.local`
2. Import mock helpers from your test utils (see patterns reference)
3. Use the mock user registry from [mock-users.md](./references/mock-users.md)

### Writing Role-Based Tests

1. Read `specs/{feature}/test.yml` — look for `role_tests` section
2. For each role in the test matrix:
   - Create a mock session with `createMockSession(userId)`
   - Test permitted actions return success
   - Test forbidden actions return 403
3. Cover provider-specific edge cases (phone-only, Apple relay email, expired tokens)

### Required Coverage

- **Every protected route** must be tested with at least: admin, editor, viewer, guest
- **Role escalation**: verify a viewer cannot access admin endpoints
- **Provider variations**: test at least 2 OAuth providers per critical flow
- **Edge cases**: expired session, banned user, unverified email, MFA required

### Key Principle

Mock auth must be **completely inert in production**. The mock auth module should:
- Only load when the env flag is set AND not in production
- Never ship mock user data in production bundles
- Use `@mock.test` email domains only (never real domains)

See [mock users reference](./references/mock-users.md) for the full 50-user registry and test scenario matrix.

## Test Patterns

See [test patterns reference](./references/patterns.md) for code examples.

## Tools (configure per project)

- **Unit/Integration**: Vitest / Jest / Pytest / Go test
- **E2E**: Playwright / Cypress
- **API Mocking**: msw / nock / responses
- **Component Testing**: React Testing Library / Vue Test Utils
- **Auth Mocking**: Mock user registry (see references/mock-users.md)
