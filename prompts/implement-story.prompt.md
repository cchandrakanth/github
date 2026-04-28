---
description: "Implement a specific user story or acceptance criterion from a spec"
agent: "coder"
argument-hint: "Spec name + scope (e.g., 'rh-long US-3' or 'rh-short AC-2.1')"
---

Implement a specific user story or acceptance criterion from an approved spec.

## Instructions

1. Parse the input to identify:
   - **Spec name**: folder name under `specs/`
   - **Scope**: `US-N` (user story) or `AC-N.M` (acceptance criterion)
2. Read all 4 spec files in `specs/{spec-name}/`
3. Verify spec `status: approved` or `status: in-progress`
4. If status changed to `in-progress`, **Sync GitHub**: update linked issue (label → `in-progress`, remove `spec-approved`)
5. Implement ONLY the specified user story or AC:
   - Follow `styles.md` for CSS/layout
   - Follow `schema.yml` for database changes
6. Check off completed ACs in `spec.md` (`- [ ]` → `- [x]`)
7. **Sync GitHub**: Comment on linked issue with progress (e.g., "AC-2.3 done, 5/8 ACs complete")
8. Run type check to verify no errors
9. If ALL ACs are now checked, update status to `implemented`
10. **Sync GitHub**: If status → `implemented`, update linked issue (label → `needs-review`, remove `in-progress`)
11. Otherwise leave status as `in-progress`
