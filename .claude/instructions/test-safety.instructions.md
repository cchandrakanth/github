# Test Safety Guidelines

> Applies to all test-related agents (`test-fixer`, `qa-engineer`) and any code under `**/*.test.*`, `**/*.spec.*`, or `**/__tests__/**`.

## Rules

**Test isolation**
- Tests use mocks, not real databases or external HTTP calls
- Test files live in `**/*.test.*`, `**/*.spec.*`, or `**/__tests__/**`
- Production code MUST NOT import from test files (no circular deps)

**No leakage into production**
- All test packages in `devDependencies` — never in `dependencies`
- Mock fixtures go in `__mocks__/` or alongside `.test.` files
- Mock auth activates ONLY when `MOCK_AUTH_ENABLED=true` AND `NODE_ENV !== 'production'`

**Credentials & data**
- All mock email addresses use `@mock.test` domain only
- No real API keys, tokens, or connection strings in test files — use `.env.test`
- Database tests use `__test_`-prefixed tables or in-memory databases

**Test discipline**
- Tests fix themselves; only modify production code if a real bug is exposed (hand off to `@bug-fixer`)
- `FIXME` comments must include date and issue: `// FIXME(YYYY-MM-DD, #123)`
- Avoid blanket `sleep()`, increased timeouts without justification, or retry loops

## Pre-Commit Checklist

- [ ] No production code imports test files
- [ ] All test packages are in `devDependencies`
- [ ] All mock credentials use `@mock.test` domain
- [ ] External calls (HTTP, DB, file I/O) are mocked
- [ ] Database ops use `__test_` prefix or in-memory DB
- [ ] `FIXME` comments have date + issue number
- [ ] No production code changed (unless it's a real bug fix)
