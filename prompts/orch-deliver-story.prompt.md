---
description: "Orchestrated: Pick a To Do story, implement code + tests, review, and prepare for merge — with human approval gates"
tools: [read, search, edit, execute, todo, github/*]
agents: [github-sync, coder, qa-engineer, reviewer]
argument-hint: "Spec name or GitHub issue number (e.g., 'rh-long' or '#42')"
---

End-to-end story delivery — from To Do to verified, with human checkpoints.

## Orchestration Flow

```
[1. Pick Story] → 🧑 HIL → [2. Implement] → [3. Test] → 🧑 HIL → [4. Review] → [5. Ready for Merge]
```

## Instructions

### Phase 1 — Story Selection & Planning

> **First**: Read `project-config.json` → `github.repository` to get the current repo. All issue operations are scoped to this repo.

1. If an argument was provided, locate that spec or GitHub issue:
   - If it's an issue number: validate it belongs to `github.repository` (check repo + `github.repositoryLabel`)
   - If validation fails → **STOP**:
     ```
     ⛔ Issue #{number} is not linked to this repository ({github.repository}).
     This board is shared across multiple apps. Use the repo this issue belongs to,
     or link the issue to this repo first.
     ```
2. If no argument, scan `specs/*/spec.md` for specs with `status: approved` (Ready column)
   - Also check GitHub Projects "Ready" column via **GitHub Sync Agent**, filtered to `github.repository`
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
6. Update spec status to `in-progress`
7. **Sync GitHub**: Update linked issue (label → `in-progress`)
8. Track progress with todo list — one item per user story or AC group
9. After implementation, run type checks and lint to catch basic errors
10. Summarize what was implemented:
    ```
    ## Implementation Summary
    - Files created: {list}
    - Files modified: {list}
    - ACs completed: {X}/{Y}
    - Type check: ✅ Pass / ❌ {errors}
    ```

---

### Phase 3 — Testing (QA Engineer Agent)

11. Hand off to **QA Engineer Agent** to create and run tests:
    - Read `test.yml` for test cases
    - Create unit, integration, and e2e tests
    - Run role-based tests if `role_tests.enabled: true`
12. Execute all tests and collect results
13. Map test results to acceptance criteria
14. Present test report:
    ```
    ## Test Results
    | AC | Description | Test | Result |
    |----|-------------|------|--------|
    | AC-1.1 | {desc} | {test file} | ✅ / ❌ |
    
    Overall: {passed}/{total} passing
    ```

### 🧑 Human Gate 2 — Review Test Results & Approve

> **Pause and ask the user:**
> - "Tests are complete. Here are the results. Proceed to code review?"
> - If any tests failed: "These ACs failed testing: {list}. Fix and re-test, or proceed anyway?"
> - Allow the user to: **Approve for review**, **Fix failures first**, or **Abort**

**Do NOT proceed past this gate without explicit user approval.**

---

### Phase 4 — Code Review (Reviewer Agent)

15. Hand off to **Reviewer Agent** to run the review checklist:
    - Spec compliance (every AC implemented)
    - Code quality and standards
    - Security rules
    - Performance checks
    - Responsive design
16. Present review findings:
    ```
    ## Review Findings
    | # | Severity | Finding | Location |
    |---|----------|---------|----------|
    | 1 | {critical/warning/info} | {description} | {file:line} |
    
    Verdict: ✅ Approved / ⚠️ Needs Changes
    ```
17. If critical findings exist, loop back to Phase 2 for fixes (with user confirmation)

---

### Phase 5 — Mark Ready for Merge

18. Update spec status to `verified` (if tests pass) or `implemented` (if review-only)
19. **Sync GitHub**: Update linked issue:
    - Label → `verified`
    - Comment with delivery summary (implementation + test results + review verdict)
    - Move to "In Review" column
20. Present final summary:
    ```
    ## Story Delivered ✅
    - **Spec**: {name}
    - **Status**: verified — ready for merge
    - **ACs**: {X}/{Y} complete
    - **Tests**: {passed}/{total} passing
    - **Review**: {verdict}
    - **Next step**: Run `merge-deploy` prompt to merge to dev and deploy
    ```

## Error Recovery

- If implementation fails mid-way: save progress, report what's done, ask user how to proceed
- If tests fail repeatedly: present failure details, suggest targeted fixes, ask user
- If review finds critical issues: loop back with specific fix instructions
- At any point the user can say "abort" to stop the orchestration

## Constraints

- ALWAYS pause at both human gates — never auto-approve
- ALWAYS show what will happen before doing it
- NEVER merge or deploy — that is the `merge-deploy` prompt's job
- NEVER skip tests even if implementation looks correct
- Track every phase in the todo list so the user sees progress
