---
description: "Create or update a feature spec — generate new 4-file spec package or refine an existing one"
agent: "planner"
argument-hint: "For new: describe the requirement | For update: spec name + what to change (e.g., 'rh-long Add CSV export user story')"
---

Define a complete spec package or update an existing one.

## Instructions

### Phase 1 — Detect Mode

1. Parse the input:
   - If input describes a **new feature** → `new-spec` mode
   - If input starts with an **existing spec name** → `update-spec` mode
   - When ambiguous, ask: "Is this a new feature or an update to an existing spec?"

---

## NEW SPEC MODE

### Phase 2A — Create Spec Package

2. Search `knowledge-base/repo-knowledge/` for relevant architecture / convention notes; cite any used in the spec's `## Dependencies` or `## Change Log`
3. Create a folder under `specs/{feature-name}/`
4. Generate all 4 files from templates in `skills/spec-management/assets/`:
   - `spec.md` — Status, user stories, ACs, edge cases
   - `styles.md` — CSS/layout details, responsive breakpoints
   - `test.yml` — Test cases mapped to ACs
   - `schema.yml` — Database schema if feature needs persistence
5. Check existing specs in `specs/` for conflicts
6. Set status to `draft`
7. **Sync GitHub**: If a linked GitHub issue exists, add `github_issue` field to spec.md, add label `spec-draft`, and comment with spec link
8. When spec is ready for review, set status to `review`
9. **Sync GitHub**: Update linked issue (label → `spec-review`, remove `spec-draft`, comment that spec is ready for review)

Use responsive design unless explicitly told otherwise.

---

## UPDATE SPEC MODE

### Phase 2B — Refine Existing Spec

2. Parse the input to identify:
   - **Spec name**: folder name under `specs/`
   - **Change type**: new user story, modified AC, or new AC
   - **Description**: what to add or change
3. Read all 4 spec files in `specs/{spec-name}/`
4. Classify the change:
   - **New user story** → Add US-N+1 with ACs to `spec.md`, update `test.yml`
   - **New AC** → Find the user story, add AC-N.M+1, update `test.yml`
   - **Modify AC** → Find and update the specific AC, update `test.yml`
5. If the change is ambiguous, ask clarifying questions with proposed defaults
6. Update all affected spec files (`spec.md`, `test.yml`, `styles.md`, `schema.yml`)
7. Add a `## Change Log` entry to `spec.md`
8. If spec was `completed`, change status to `approved` (re-opens for implementation)
9. **Sync GitHub**: If status changed, update linked issue labels per lifecycle label map and comment with change summary
