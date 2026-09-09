---
description: "Run tests for a feature and validate all acceptance criteria pass"
argument-hint: "Spec name (folder name under specs/)"
---

> Run with the **qa-engineer** subagent (`.claude/agents/qa-engineer.md`). Arguments: `$ARGUMENTS`

Test the specified feature against its spec.

## Instructions

1. Read `specs/{feature-name}/test.yml` for test cases
2. Read `specs/{feature-name}/spec.md` for acceptance criteria
3. Run or create test files from test.yml — for e2e work, read `skills/testing/references/locators.md` before writing locators and `skills/testing/references/playwright.md` for setup and flake triage
4. If `role_tests.enabled: true` in test.yml:
   - Set `MOCK_AUTH_ENABLED=true` in the test environment
   - Create/run role-based access tests from the access matrix
   - Create/run OAuth provider-specific tests
   - Create/run edge case tests (expired, banned, unverified users)
   - Reference `skills/testing/references/mock-users.md` for user details
5. Execute tests using the project's test runner
6. Map results to each AC — reporting only; do NOT check or uncheck AC checkboxes (they track implementation and are owned by the Coder)
7. If all pass, update spec status to `verified`
8. **Sync GitHub**: If spec has `github_issue` field, update linked issue (label → `verified`, remove `needs-review`, comment with test results)
9. Report coverage per AC, per role, and per OAuth provider
