# Knowledge Base

Persistent project memory for **Improve My Notes App**. Agents read the relevant subfolder **before** non-trivial work and write back **after** durable insights, per `CLAUDE.md` → "Knowledge Base (read-first / write-after)".

## Layout

| Folder | Contains | Read before… | Written by |
|--------|----------|--------------|------------|
| `repo-knowledge/` | Architecture notes, conventions, integration quirks, lightweight ADRs | Implementing, reviewing, or onboarding | `knowledge-base` subagent |
| `fix-history/` | One entry per non-trivial bug fix | Debugging or fixing a bug | `bug-fixer` subagent |
| `automation-test-fixes/` | One entry per stabilized flaky/failing test | Touching a failing or flaky test | `test-fixer` subagent |

## When to add an entry

Add an entry when the insight would save a future agent or developer real time:

- A bug whose root cause was non-obvious (took > ~30 min to diagnose), or that could recur
- A workaround, quarantined test, or revert — record with `fix_type: workaround` so the debt stays visible
- An architectural decision or constraint not obvious from the code (e.g. "reminder scheduling must go through `src/lib/notifications.ts` because ids are persisted")
- An integration quirk (expo-sqlite, expo-notifications, NativeWind, editor WebView…) that cost time to discover

Do **not** add entries for trivial typo fixes, routine dependency bumps, or anything fully explained by a spec.

## Rules

- **Search first** — grep the subfolder by keyword, file path, error message, or `tags:` frontmatter before proposing a fix or design
- **Write after** — use the folder's `TEMPLATE.md`; one file per entry, kebab-case name prefixed with date (`2026-07-11-example-slug.md`)
- **Be honest** — workarounds are labeled as workarounds
- **Cross-link** — link related specs (`specs/…`), GitHub issues (`#N`), and other KB entries
