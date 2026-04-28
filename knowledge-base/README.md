# Knowledge Base

A persistent, repo-scoped knowledge store that agents read **before** acting and write to **after** completing work. The goal: stop re-discovering the same facts, fixes, and flaky-test workarounds on every task.

## Structure

| Folder | Purpose | Owning Agent |
|--------|---------|--------------|
| `repo-knowledge/` | Architecture notes, conventions, gotchas, integration quirks, domain glossary, decisions (ADR-lite) | `@knowledge-base` |
| `fix-history/` | Bug fixes — root cause, fix, verification, prevention. One file per fix. | `@bug-fixer` |
| `automation-test-fixes/` | Automation/E2E/unit test fixes — flake patterns, selector drift, timing fixes, mock issues. | `@test-fixer` |

## How agents use it

- **Read first** — Before implementing, reviewing, or debugging, agents grep the relevant subfolder for prior context (similar bugs, similar test failures, related repo facts).
- **Write after** — When a non-trivial fix or insight is produced, the corresponding agent appends a new entry. Each entry is a single Markdown file using the matching `TEMPLATE.md`.
- **Search-friendly** — File names start with `YYYY-MM-DD-<short-slug>.md`. Tag entries with `tags:` frontmatter so grep-by-keyword works.

## File naming

```
repo-knowledge/         <topic-slug>.md            (durable; not date-prefixed)
fix-history/            YYYY-MM-DD-<slug>.md
automation-test-fixes/  YYYY-MM-DD-<slug>.md
```

## When to add an entry

Add an entry when **any** of these are true:
- The fix took more than 30 minutes to find
- The root cause was non-obvious or surprising
- The same problem could plausibly recur in another spec/feature
- A convention, integration quirk, or environmental gotcha was uncovered
- A flaky test was stabilized

Do **not** add an entry for trivial typos, one-line refactors, or noise.
