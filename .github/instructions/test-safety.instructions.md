---
description: "Applies to all test-related agents (test-fixer, qa-engineer) and any code under **/*.test.*, **/*.spec.*, or **/__tests__/**."
applyTo: "**/*.{test,spec}.*"
---

# Test Safety Guidelines

> Applies to all test-related agents (`test-fixer`, `qa-engineer`) and any code under `**/*.test.*`, `**/*.spec.*`, or `**/__tests__/**`.

## Rules

**Test isolation**
- Unit and API tests mock external HTTP calls, third-party services, and file I/O
- Database-level invariant tests (RLS, `CHECK` constraints, `GENERATED` columns, triggers) run against an isolated in-memory or ephemeral test database engine (`testing.dbIntegrationEngine`) — see exception below
- Test files live in `**/*.test.*`, `**/*.spec.*`, or `**/__tests__/**`
- Production code MUST NOT import from test files (no circular deps)

**No leakage into production**
- All test packages in `devDependencies` — never in `dependencies`
- Mock fixtures go in `__mocks__/` or alongside `.test.` files
- Mock auth activates ONLY when `MOCK_AUTH_ENABLED=true` AND `NODE_ENV !== 'production'`

**Credentials & data**
- All mock email addresses use `@mock.test` domain only
- No real API keys, tokens, or production connection strings in test files — use `.env.test`
- Database tests use `__test_`-prefixed tables/schemas or ephemeral in-memory databases

**Test discipline**
- Tests fix themselves; only modify production code if a real bug is exposed (hand off to `@bug-fixer`)
- `FIXME` comments must include date and issue: `// FIXME(YYYY-MM-DD, #123)`
- Avoid blanket `sleep()`, increased timeouts without justification, or retry loops

## Relational Database Invariant Testing Exception

Do **not** mock the database when testing database-enforced invariants:
1. Row-Level Security (`ENABLE` / `FORCE ROW LEVEL SECURITY`) cross-user or cross-tenant isolation
2. Declarative `CHECK (...)`, `UNIQUE`, and `FOREIGN KEY` constraints
3. `GENERATED ALWAYS AS (...) STORED` computed columns
4. Database triggers (e.g., `BEFORE UPDATE OR DELETE` immutability / WORM locks, audit triggers)

Instead, run database integration tests (`db_integration_tests` in `test.yml`) against the project's configured `testing.dbIntegrationEngine` (e.g., in-memory `@electric-sql/pglite`, in-memory SQLite, or an isolated local test container / `__test_` schema) initialized with the real SQL migrations:
- **Cross-Tenant / Cross-User RLS Negative Test**: Seed a record under `user_A`, switch session context to `user_B`, and assert `SELECT` returns `0 rows` and `UPDATE`/`DELETE` fails or affects `0 rows`.
- **Constraint & Immutability Trigger Test**: Attempt an invalid write or mutation on a locked/immutable row and assert the database raises the expected constraint or trigger error.
- **Resource & Memory Cleanup Test**: When testing code that processes sensitive or large in-memory buffers (`Float32Array`, `ArrayBuffer`, streams), assert cleanup (e.g., `buffer.fill(0)` in `finally`) executes even when an error is thrown.

## Pre-Commit Checklist

- [ ] No production code imports test files
- [ ] All test packages are in `devDependencies`
- [ ] All mock credentials use `@mock.test` domain
- [ ] External network/HTTP calls are mocked
- [ ] Database ops use `__test_` prefix, isolated test container, or in-memory DB (`testing.dbIntegrationEngine`)
- [ ] `FIXME` comments have date + issue number
- [ ] No production code changed (unless it's a real bug fix)
