---
description: "Update an existing spec — add user stories, modify acceptance criteria, or refine requirements"
agent: "planner"
argument-hint: "Spec name + what to change (e.g., 'rh-long Add CSV export user story')"
---

Update an existing spec with new user stories or acceptance criteria changes.

## Instructions

1. Parse the input to identify:
   - **Spec name**: folder name under `specs/`
   - **Change type**: new user story, modified AC, or new AC
   - **Description**: what to add or change
2. Read all 4 spec files in `specs/{spec-name}/`
3. Classify the change:
   - **New user story** → Add US-N+1 with ACs to `spec.md`, update `test.yml`
   - **New AC** → Find the user story, add AC-N.M+1, update `test.yml`
   - **Modify AC** → Find and update the specific AC, update `test.yml`
4. If the change is ambiguous, ask clarifying questions with proposed defaults
5. Update all affected spec files (`spec.md`, `test.yml`, `styles.md`, `schema.yml`)
6. Add a `## Change Log` entry to `spec.md`
7. If spec was `completed`, change status to `approved` (re-opens for implementation)
8. **Sync GitHub**: If status changed, update linked issue labels per lifecycle label map and comment with change summary
