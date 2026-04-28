---
description: "Create a new feature spec with all 4 required files from a requirement description"
agent: "planner"
argument-hint: "Describe the feature requirement"
---

Create a complete spec package for the described feature.

## Instructions

1. Search `knowledge-base/repo-knowledge/` for relevant architecture / convention notes; cite any used in the spec's `## Dependencies` or `## Change Log`
2. Create a folder under `specs/{feature-name}/`
3. Generate all 4 files from templates in `.github/skills/spec-management/assets/`:
   - `spec.md` — Status, user stories, ACs, edge cases
   - `styles.md` — CSS/layout details, responsive breakpoints
   - `test.yml` — Test cases mapped to ACs
   - `schema.yml` — Database schema if feature needs persistence
4. Check existing specs in `specs/` for conflicts
5. Set status to `draft`
6. **Sync GitHub**: If a linked GitHub issue exists, add `github_issue` field to spec.md, add label `spec-draft`, and comment with spec link
7. When spec is ready for review, set status to `review`
8. **Sync GitHub**: Update linked issue (label → `spec-review`, remove `spec-draft`, comment that spec is ready for review)

Use responsive design unless explicitly told otherwise.
