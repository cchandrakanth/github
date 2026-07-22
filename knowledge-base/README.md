# Knowledge Base

Durable, greppable project knowledge. Lives at the **project root** (never inside `.github/` or `.claude/`) so both toolchains and all agents share one store.

## Layout

| Folder | Contains | Owning agent | Read before… |
|--------|----------|--------------|--------------|
| `repo-knowledge/` | Architecture notes, conventions, integration quirks, domain glossary, lightweight ADRs | `knowledge-base` | Implementing, reviewing, or onboarding |
| `fix-history/` | One entry per non-trivial bug fix (symptom → root cause → fix → prevention) | `bug-fixer` | Debugging or fixing a bug |
| `automation-test-fixes/` | One entry per non-trivial test stabilization (flaky, failing, quarantined) | `test-fixer` | Touching a failing or flaky test |

Each folder has a `TEMPLATE.md` — **always copy the template** for new entries; never invent your own structure.

## Rules

- **Search first.** Grep the relevant subfolder by keyword, file path, error message, or `tags:` frontmatter before proposing a fix or design.
- **Write after.** Record every non-trivial fix or reusable insight using the folder's `TEMPLATE.md`. File names for fixes: `YYYY-MM-DD-<short-slug>.md`.
- **Be honest.** Workarounds, quarantined tests, and reverts are recorded with `fix_type: workaround` (or equivalent) so the debt stays visible.
- **Cross-link.** Link entries to related specs (`specs/…`), GitHub issues (`#N`), and other knowledge-base entries.
- **Consolidate.** After writing a new entry, grep for overlapping older entries and merge or cross-link rather than duplicating.

## When to add an entry

Add an entry when the insight would save a future agent or developer real time:

- The root cause was non-obvious (took more than one attempt to find)
- The fix encodes a convention or pattern others must follow
- The failure will plausibly recur elsewhere in the codebase
- A workaround or quarantine leaves debt that must stay visible

Skip entries for trivial typos, one-line obvious fixes, or knowledge already captured in `project-config.json`, `CLAUDE.md`, or an existing entry (update that entry instead).
