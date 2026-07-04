---
description: "Orchestrated QE: Create integrated test plan + Playwright tests on a test branch, run UI tests, manual testing HIL, merge to dev, and move story to Ready To Deploy"
tools: [read, search, edit, execute, todo, github/*]
agents: [github-sync, qa-engineer, reviewer]
argument-hint: "GitHub issue number or spec name (e.g., '#42' or 'rh-long')"
---

End-to-end QE validation — from **Testing → Ready To Deploy**, with human checkpoints.

**Swim lane**: `Testing` → `Ready To Deploy`
**Stateful**: Re-running on the same issue resumes from the last recorded phase. Each phase appends a timestamped comment to the GitHub issue — nothing is overwritten.

> **Scope**: This prompt owns all Playwright UI tests and integrated test coverage. Unit/component tests were already written by `orch-deliver-story`. Code is already deployed to the dev environment by `orch-merge-deploy`.

## Orchestration Flow

```
[1. Resume Check] → [2. Pick Story] → [3. Create Test Branch] → [4. Test Plan + Playwright Tests] →
[5. Run UI Tests] → [6. Manual Testing] → 🧑 HIL → [7. Review Changes] → 🧑 HIL →
[8. Merge Test Branch to Dev] → [9. Move to Ready To Deploy]
```

## Instructions

### Phase 0 — Resume Check (Stateful)

> **First**: Read `project-config.json` → `github.repository`, `testing.e2eFramework`.

If an issue number was provided, fetch the issue and scan its comments for any prior `[orch-qe]` state comments.
- If a prior state comment is found → display the last recorded phase and ask:
  > "This story was last worked on at Phase {N} ({description}). Resume from there, restart from the beginning, or abort?"
- If no prior state → proceed to Phase 1.

**State is always appended as a new comment, never edited.** Use this format for every state update:
```
**[orch-qe] Phase {N} — {phase name}** · {ISO timestamp}
- Status: in-progress | completed | blocked
- Notes: {brief summary}
```

---

### Phase 1 — Story Selection

1. If an argument was provided (issue number or spec name):
   - **Validate repo link**: issue must belong to `github.repository`; fail with standard scope-violation message if not
   - Fetch full issue and read `specs/{name}/spec.md`, `test.yml`
2. If no argument, query GitHub Projects **Testing** column filtered to `github.repository`:
   - List all stories currently in Testing:
     ```
     ## Stories in Testing
     | # | Spec | Summary | ACs | Dev Deploy |
     |---|------|---------|-----|------------|
     | 1 | {name} | {description} | {count} | {URL or 'pending'} |
     ```
   - If only one story → auto-select, confirm with user
   - If multiple → ask user to pick
3. Read `specs/{name}/spec.md`, `styles.md`, `schema.yml`, `test.yml` for the selected story
4. Read `knowledge-base/automation-test-fixes/` for any prior test issues on this area
5. Verify the feature is accessible on the dev environment before proceeding

---

### Phase 2 — Create Test Branch

6. Derive the test branch name from the issue:
   - Format: `{issue-number}-test` (e.g., `42-test`)
7. Check if the test branch already exists:
   - If yes → check it out and continue
   - If no → create from dev:
     ```bash
     git checkout dev && git pull origin dev
     git checkout -b {issue-number}-test
     ```
8. **Sync GitHub**: Append a state comment to the issue:
   ```
   **[orch-qe] Phase 2 — Test Branch Created** · {timestamp}
   - Status: completed
   - Branch: `{issue-number}-test`
   - Label added: `qe-in-progress`
   ```
   Then add label `qe-in-progress`.

---

### Phase 3 — Test Plan & Playwright Test Creation (QA Engineer Agent)

9. Hand off to **QA Engineer Agent** to create the test plan and Playwright tests:
   - Read `test.yml` for AC-to-test-case mappings
   - Read `knowledge-base/automation-test-fixes/` for patterns to avoid known flaky test issues
   - Create a `TEST-PLAN.md` in the spec folder:
     ```markdown
     # Test Plan — {spec-name}
     ## Scope
     - ACs covered: {list}
     - Test types: Playwright UI, integration, API
     ## Test Data Strategy
     - {Describe test data setup — note: test data is complex, document all seed/fixture requirements}
     - Fixtures: {list of fixture files}
     - Seed scripts: {list if applicable}
     ## Test Cases
     | ID | AC | Description | Type | Priority |
     |----|-----|-------------|------|----------|
     | TC-1 | AC-1.1 | {description} | Playwright | P1 |
     ```
   - Create Playwright test files under the project's e2e test directory:
     - One file per major user story (e.g., `{spec-name}-{us-number}.spec.ts`)
     - Use page object pattern if the project already uses it
     - Handle complex test data via fixtures — document all test data dependencies in `TEST-PLAN.md`
     - Include: happy paths, edge cases, error states, role-based access (if applicable)
     - Tag tests by AC: `test.describe('AC-1.1 — {description}', ...)`
   - Add integration tests for any API changes not covered by unit tests
10. Commit test files to the test branch:
    ```bash
    git add .
    git commit -m "test({spec-name}): add Playwright + integration tests for #{issue}"
    ```
11. **Sync GitHub**: Append a state comment:
    ```
    **[orch-qe] Phase 3 — Test Plan + Playwright Tests Written** · {timestamp}
    - Status: completed
    - Test plan: `specs/{name}/TEST-PLAN.md`
    - Playwright files: {list}
    - Test cases: {count} ({count-p1} P1, {count-p2} P2)
    - Test data notes: {brief summary of complex data requirements}
    ```

---

### Phase 4 — Run UI Tests

12. Run the Playwright test suite against the dev environment:
    ```bash
    npx playwright test --project={project} {spec-name}*.spec.ts
    # or project equivalent: npm run test:e2e -- --grep "{spec-name}"
    ```
13. Collect results and map to ACs:
    ```
    ## Playwright Test Results
    | TC | AC | Description | Result | Notes |
    |----|----|-------------|--------|-------|
    | TC-1 | AC-1.1 | {desc} | ✅ / ❌ | {failure detail} |
    
    Overall: {passed}/{total} passing
    Flaky: {count}
    ```
14. For any failures:
    - Check `knowledge-base/automation-test-fixes/` for known fixes
    - Attempt to fix flaky tests (retry logic, wait conditions, test data)
    - For genuine product failures: document clearly as "Product bug found"
15. **Sync GitHub**: Append a state comment:
    ```
    **[orch-qe] Phase 4 — UI Tests Run** · {timestamp}
    - Status: {completed | blocked}
    - Playwright: {passed}/{total} passing
    - Failures: {list or 'none'}
    - Product bugs found: {count or 'none'}
    ```

---

### Phase 5 — Manual Testing

16. Present a manual testing checklist derived from the spec's user stories and ACs:
    ```
    ## Manual Testing Checklist
    Please verify the following on the dev environment ({URL}):
    
    **User Story 1 — {title}**
    - [ ] AC-1.1: {testable description}
    - [ ] AC-1.2: {testable description}
    
    **User Story 2 — {title}**
    - [ ] AC-2.1: {testable description}
    
    **Cross-cutting**
    - [ ] Responsive design (mobile + desktop)
    - [ ] Accessibility (keyboard nav, screen reader)
    - [ ] Error states and edge cases
    ```
17. Note any areas where test data complexity requires specific setup instructions

### 🧑 Human Gate 1 — Manual Testing & Test Results Sign-off

> **Pause and ask the user:**
> - "Automated tests are complete. Please perform manual testing using the checklist above on: {dev-URL}"
> - "After manual testing, report: which items passed, which failed, and any observations"
> - If any automated tests failed: "These tests are failing: {list}. Are these product bugs or test issues?"
> - Allow the user to:
>   - **All pass** → proceed to review
>   - **Some failures** → specify which are bugs vs test issues; agent addresses test issues, logs bugs as new GitHub issues
>   - **Abort** → stop

**Do NOT proceed past this gate without explicit user approval and manual testing results.**

---

### Phase 6 — Review Changes (Reviewer Agent)

18. Hand off to **Reviewer Agent** to review the test code quality:
    - Test coverage completeness (all ACs covered?)
    - Test quality (assertions meaningful, not just happy-path?)
    - Test data documentation completeness
    - No hardcoded credentials or sensitive data in tests
    - Playwright patterns consistent with project standards
19. Present review findings:
    ```
    ## Test Code Review
    | # | Severity | Finding | Location |
    |---|----------|---------|----------|
    | 1 | warning/info | {description} | {file:line} |
    
    Coverage: {X}/{Y} ACs have automated tests
    Verdict: ✅ Approved / ⚠️ Needs Changes
    ```

### 🧑 Human Gate 2 — Approve & Merge to Dev

> **Pause and ask the user:**
> - "Manual testing complete, Playwright tests passing, review done. Ready to merge test branch to dev and move to Ready To Deploy?"
> - Show: test results summary, manual testing outcomes, review verdict
> - If critical review findings: "These issues were found: {list}. Fix first?"
> - Allow the user to: **Approve merge**, **Fix issues first**, or **Abort**

**Do NOT proceed past this gate without explicit user approval.**

---

### Phase 7 — Merge Test Branch to Dev

20. Create a PR for the test branch:
    ```bash
    gh pr create \
      --base dev \
      --head {issue-number}-test \
      --title "test({spec-name}): add Playwright + integration tests (#{issue})" \
      --body "{PR body — see template below}"
    ```
    PR body must include:
    - Linked issue (reference only — do NOT close; issue stays open until `orch-po`)
    - Test plan link: `specs/{name}/TEST-PLAN.md`
    - Playwright results summary
    - Manual testing sign-off summary
    - Any known test data requirements
21. Merge the PR (squash):
    ```bash
    gh pr merge {pr-number} --squash --delete-branch
    git checkout dev && git pull origin dev
    ```
22. **Sync GitHub**: Append a state comment to the issue:
    ```
    **[orch-qe] Phase 7 — Test Branch Merged to Dev** · {timestamp}
    - Status: completed
    - PR: #{pr-number} merged
    - Playwright: {passed}/{total}
    - Manual testing: signed off
    - Column: moved to **Ready To Deploy**
    - Next: run `orch-po` to bundle with release and deploy to production
    ```
    Then:
    - Label → `qe-verified`, remove `qe-in-progress`
    - Move issue card to **Ready To Deploy** column on Projects board
23. Present final summary:
    ```
    ## QE Complete ✅
    - **Spec**: {name}
    - **Test branch**: {issue-number}-test → merged to dev
    - **PR**: #{number}
    - **Playwright**: {passed}/{total} passing
    - **Manual testing**: ✅ signed off
    - **GitHub Issue**: #{number} → Ready To Deploy column
    
    ➡️ Next: Run `orch-po` to bundle this with other Ready To Deploy stories and deploy to production.
    ```

## Error Recovery

- If dev environment is not accessible: ask user to verify deploy before proceeding
- If test data setup is too complex to automate: document fully in `TEST-PLAN.md`, flag as manual-only test case
- If Playwright tests repeatedly flaky: record fix in `knowledge-base/automation-test-fixes/`, add retry logic
- If product bugs found during manual testing: create new GitHub issues tagged `bug`, link to original story, ask user whether to block or proceed
- If test branch has conflicts with dev: present conflict files, ask user to resolve
- At any point the user can say "abort" to stop the orchestration

## Constraints

- ALWAYS create the test branch as `{issue-number}-test` — never reuse the feature branch for tests
- ALWAYS document complex test data requirements in `TEST-PLAN.md`
- ALWAYS read `knowledge-base/automation-test-fixes/` before writing tests
- ALWAYS append state comments — never overwrite previous state comments
- ALWAYS get manual testing sign-off at Human Gate 1
- NEVER mark issue as closed — that is `orch-po`'s responsibility
- NEVER deploy to production — this prompt only merges tests to dev
- NEVER skip Playwright tests even if manual testing passes
- Track every phase in the todo list so the user sees progress
