---
description: "Orchestrated: Pick a Ready story, implement code + unit/component tests, and move to Developed — with human approval gates"
tools: [read, search, edit, execute, todo, github/*]
agents: [github-sync, coder]
argument-hint: "Spec name or GitHub issue number (e.g., 'rh-long' or '#42')"
---

End-to-end story implementation — from **Ready → Developed**, with human checkpoints.

**Swim lane**: `Ready` → `Developed`
**Stateful**: Re-running on the same issue resumes from the last recorded phase. Each phase appends a timestamped comment to the GitHub issue — nothing is overwritten.

> **Scope**: This prompt delivers working code and unit/component/integration tests. Playwright UI tests are handled downstream by `orch-qe`. Code review and PR creation are handled by `orch-merge-deploy`.

## Orchestration Flow

```
[1. Resume Check] → [2. Pick Story] → 🧑 HIL → [3. Implement] → [4. Unit Tests] → 🧑 HIL → [5. Move to Developed]
```

## Instructions

### Phase 0 — Resume Check (Stateful)

> **First**: Read `project-config.json` → `github.repository`.

If an issue number was provided, fetch the issue and scan its comments for any prior `[orch-deliver-story]` state comments.
- If a prior state comment is found → display the last recorded phase and ask:
  > "This story was last worked on at Phase {N} ({description}). Resume from there, restart from the beginning, or abort?"
- If no prior state → proceed to Phase 1.

**State is always appended as a new comment, never edited.** Use this format for every state update:
```
**[orch-deliver-story] Phase {N} — {phase name}** · {ISO timestamp}
- Status: in-progress | completed | blocked
- Notes: {brief summary}
```

---

### Phase 1 — Story Selection & Planning

1. If an argument was provided, locate that spec or GitHub issue:
   - If it's an issue number: validate it belongs to `github.repository` (check repo + `github.repositoryLabel`)
   - If validation fails → **STOP**:
     ```
     ⛔ Issue #{number} is not linked to this repository ({github.repository}).
     This board is shared across multiple apps. Use the repo this issue belongs to,
     or link the issue to this repo first.
     ```
2. If no argument, scan `specs/*/spec.md` for specs with `status: approved`
   - Also check GitHub Projects **Ready** column via **GitHub Sync Agent**, filtered to `github.repository`
3. Present the candidate stories to the user:
   ```
   ## Ready Stories
   | # | Spec | Summary | ACs | GitHub Issue |
   |---|------|---------|-----|-------------|
   | 1 | {name} | {description} | {count} | #{number} |
   ```
4. Read the full spec files (`spec.md`, `styles.md`, `schema.yml`, `test.yml`) for the selected story

### 🧑 Human Gate 1 — Confirm Story & Plan

> **Pause and ask the user:**
> - "Here is the story and its acceptance criteria. Proceed with implementation?"
> - Show the AC list and estimated scope
> - Allow the user to: **Approve**, **Pick a different story**, or **Adjust scope** (e.g., implement only specific user stories)

**Do NOT proceed past this gate without explicit user approval.**

---

### Phase 2 — Implementation (Coder Agent)

5. Hand off to **Coder Agent** to implement the spec:
   - Implement all acceptance criteria per `implement-spec` prompt
   - Follow `instructions/` rules for components, API routes, database, styling, etc.
6. Update spec status to `in-progress`
7. **Sync GitHub**: Append a state comment to the issue:
   ```
   **[orch-deliver-story] Phase 2 — Implementation Started** · {timestamp}
   - Status: in-progress
   - Label: `in-progress`
   - ACs in scope: {list}
   ```
   Then add label `in-progress`.
8. Track progress with todo list — one item per user story or AC group
9. After implementation, run type checks and lint to catch basic errors
10. Summarize what was implemented:
    ```
    ## Implementation Summary
    - Files created: {list}
    - Files modified: {list}
    - ACs completed: {X}/{Y}
    - Type check: ✅ Pass / ❌ {errors}
    - Lint: ✅ Pass / ⚠️ {warnings}
    ```

---

### Phase 3 — Unit & Component Tests

> **Scope**: Unit tests, component tests, and integration tests only. **Do NOT write Playwright or end-to-end UI tests** — those are created by `orch-qe`.

11. Read `test.yml` for expected unit/component test cases
12. Write tests covering:
    - Unit tests for all new functions/utilities
    - Component tests for all new UI components (using the project's component test framework)
    - Integration tests for API routes and data layer changes
    - Edge cases and error paths defined in `test.yml`
13. Run the test suite and collect results:
    ```bash
    npm run test        # or project equivalent
    npm run typecheck
    ```
14. Map test results to acceptance criteria
15. Present test report:
    ```
    ## Unit/Component Test Results
    | AC | Description | Test File | Result |
    |----|-------------|-----------|--------|
    | AC-1.1 | {desc} | {test file} | ✅ / ❌ |
    
    Overall: {passed}/{total} passing
    Note: Playwright/e2e tests will be added by orch-qe
    ```

### 🧑 Human Gate 2 — Review Results & Approve for Merge Pipeline

> **Pause and ask the user:**
> - "Implementation and unit tests are complete. Here are the results. Move this story to Developed and hand off to `orch-merge-deploy`?"
> - If any tests failed: "These ACs failed testing: {list}. Fix and re-test, or proceed anyway?"
> - Allow the user to: **Approve (move to Developed)**, **Fix failures first**, or **Abort**

**Do NOT proceed past this gate without explicit user approval.**

---

### Phase 4 — Move to Developed

16. Commit all remaining changes:
    ```bash
    git add -A
    git commit -m "feat({spec-name}): implement {spec title} — ACs {X}/{Y} complete"
    git push origin {branch}
    ```
17. Update spec status to `implemented`
18. **Sync GitHub**: Append a state comment to the issue:
    ```
    **[orch-deliver-story] Phase 4 — Developed** · {timestamp}
    - Status: completed
    - ACs completed: {X}/{Y}
    - Unit tests: {passed}/{total} passing
    - Branch: `{branch}`
    - Column: moved to **Developed**
    - Next: run `orch-merge-deploy` for code review, PR, and dev deploy
    ```
    Then:
    - Label → `implemented`, remove `in-progress`
    - Move issue card to **Developed** column on Projects board
19. Present final summary:
    ```
    ## Story Developed ✅
    - **Spec**: {name} (status: implemented)
    - **ACs**: {X}/{Y} complete
    - **Unit tests**: {passed}/{total} passing
    - **Branch**: {branch}
    - **GitHub Issue**: #{number} → Developed column
    
    ➡️ Next: Run `orch-merge-deploy` to review code, create PR, and deploy to the dev branch.
    ```

## Error Recovery

- If implementation fails mid-way: save progress, append a blocked state comment, report what's done, ask user how to proceed
- If tests fail repeatedly: present failure details, suggest targeted fixes, ask user
- At any point the user can say "abort" to stop the orchestration

## Constraints

- ALWAYS pause at both human gates — never auto-approve
- ALWAYS show what will happen before doing it
- ALWAYS append state comments — never overwrite previous state comments
- NEVER write Playwright or e2e UI tests — that is `orch-qe`'s job
- NEVER run code review — that is `orch-merge-deploy`'s job
- NEVER merge or deploy — that is `orch-merge-deploy`'s job
- Track every phase in the todo list so the user sees progress
