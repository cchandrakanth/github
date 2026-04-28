# Fix History

Bug fix log. One entry per fix. Curated by `@bug-fixer`. Read by `@coder`, `@reviewer`, and `@qa-engineer` before debugging similar issues.

## Format

`YYYY-MM-DD-<short-slug>.md` using `TEMPLATE.md`.

## What qualifies

A fix entry is added when **any** of these are true:
- Root cause was non-obvious
- Fix touched more than one file or layer
- Same class of bug could recur elsewhere
- A regression was introduced and reverted
- A workaround (not a true fix) was applied — document so the debt is visible

## Indexing

`@bug-fixer` may grep this folder by `tags:`, error message, file path, or symptom phrase before suggesting a fix.
