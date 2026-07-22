---
description: "Implement an approved spec — read spec files and build the feature"
argument-hint: "Spec name (folder name under specs/)"
---

> Run with the **coder** subagent (`.claude/agents/coder.md`). Arguments: `$ARGUMENTS`

Implement the specified feature from its approved spec.

## Instructions

1. Read all 4 spec files in `specs/{feature-name}/`
2. Search `knowledge-base/repo-knowledge/` for conventions relevant to the affected area; apply them. If the spec contradicts an entry, pause and flag instead of silently diverging.
3. Verify `status: approved` in spec.md
4. Update status to `in-progress`
5. **Sync GitHub**: If spec has `github_issue` field, update the linked issue (label → `in-progress`, remove `spec-approved`, comment: "Implementation started")
6. Implement per acceptance criteria:
   - Follow `styles.md` for CSS/layout
   - Follow `schema.yml` for database changes
   - Create components in the appropriate feature directory
   - Check each AC checkbox in `spec.md` (`- [ ]` → `- [x]`) as soon as its code is implemented — do NOT wait for automation tests (tests gate `verified`, not the checkbox)
7. Run type check to verify no errors
8. Update spec status to `implemented` — allowed only when every AC checkbox is `[x]`
9. **Sync GitHub**: Update linked issue (label → `needs-review`, remove `in-progress`, comment with implementation summary)
