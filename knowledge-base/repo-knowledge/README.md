# Repo Knowledge

Durable facts about this repository: architecture, conventions, integration quirks, domain glossary, and lightweight decision records.

Curated by `@knowledge-base`. Read by all agents before non-trivial work.

## Format

One Markdown file per topic. File name = topic slug (no date prefix). Use `TEMPLATE.md` as the starting point.

Suggested topics:
- `architecture-overview.md`
- `data-model.md`
- `auth-flow.md`
- `deployment-pipeline.md`
- `domain-glossary.md`
- `decisions/ADR-XXXX-<title>.md` (optional subfolder for decision records)

## Update rules

- Update in-place when facts change — do not stack stale versions.
- If a decision is reversed, leave the old ADR but mark it `status: superseded` and link to the new one.
- Keep entries scannable: bullet points over prose.
