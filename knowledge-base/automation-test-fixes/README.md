# Automation Test Fixes

Log of fixes to automated tests (unit, integration, E2E). Curated by `@test-fixer`. Read by `@qa-engineer` and `@coder` before touching flaky or failing tests.

## Format

`YYYY-MM-DD-<short-slug>.md` using `TEMPLATE.md`.

## What qualifies

- Flake stabilization (timing, network, animation, race conditions)
- Selector drift after UI refactor
- Mock / fixture drift
- Test environment issues (CI vs local, browser version, headless quirks)
- A test was deleted / quarantined — document why so it isn't silently lost

## Anti-pattern alert

If a fix is "added a sleep / retry / disabled the test", flag it as `fix_type: workaround` and open a follow-up issue. The next person needs to see the debt.
