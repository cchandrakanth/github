---
description: "Orchestrated PO: Bundle Ready To Deploy stories into a release branch, verify, create PR to master, deploy to production, and move stories to Done"
tools: [read, search, edit, execute, todo, github/*]
agents: [github-sync, reviewer, qa-engineer]
argument-hint: "Optional: Specific issue numbers to include (e.g., '#42 #43'). Omit to bundle all Ready To Deploy stories."
---

End-to-end production release — bundle **Ready To Deploy** stories, verify, merge to master, deploy to prod, and move to **Done**.

**Swim lane**: `Ready To Deploy` → `Done`
**Stateful**: Re-running on the same release resumes from the last recorded phase. Each phase appends a timestamped comment to all included GitHub issues — nothing is overwritten.

> **Scope**: This prompt owns the production release. It assumes all stories have passed `orch-qe` (Playwright tests + manual testing sign-off). It creates a release branch, runs final verification, creates a PR to master, and deploys to production.

## Orchestration Flow

```
[1. Resume Check] → [2. Bundle Stories] → 🧑 HIL → [3. Create Release Branch] →
[4. Automated + Manual Verification] → 🧑 HIL → [5. Create PR to Master] →
🧑 HIL (final approval) → [6. Merge & Deploy to Prod] → [7. Post-Deploy Verify] → [8. Move to Done]
```

## Instructions

### Phase 0 — Resume Check (Stateful)

> **First**: Read `project-config.json` → `github.repository`, `hosting.platform`, `hosting.cicd`.

Check for an existing open release branch:
```bash
git branch -r | grep 'release/'
```
- If a release branch is found → read its included issues from the branch name or associated PR
- Ask:
  > "Found existing release branch `{branch}`. Resume this release, start a new one, or abort?"
- If no prior release branch → proceed to Phase 1.

**State is always appended as a new comment on ALL included issues, never edited.** Use this format:
```
**[orch-po] Phase {N} — {phase name}** · {ISO timestamp}
- Release: `{release-branch}`
- Status: in-progress | completed | blocked
- Notes: {brief summary}
```

---

### Phase 1 — Bundle Stories

1. If specific issue numbers were provided as arguments:
   - Validate each belongs to `github.repository`
   - Verify each has label `qe-verified` (passed `orch-qe`)
   - Warn if any issue is NOT in the **Ready To Deploy** column
2. If no arguments, query GitHub Projects **Ready To Deploy** column filtered to `github.repository`:
   - Fetch all stories with label `qe-verified`
3. Present the release bundle for review:
   ```
   ## Release Bundle
   | # | Issue | Spec | Summary | ACs | QE Status |
   |---|-------|------|---------|-----|-----------|
   | 1 | #{n} | {spec} | {summary} | {count} | ✅ qe-verified |
   
   Total: {count} stories, {total ACs} ACs
   ```
4. Check for stories in Ready To Deploy that are NOT `qe-verified`:
   - List them separately as "Not yet QE verified — excluded from this release"

### 🧑 Human Gate 1 — Confirm Release Bundle

> **Pause and ask the user:**
> - "Here are the stories ready for production release. Confirm the bundle and proceed?"
> - Allow the user to: **Approve all**, **Exclude specific stories**, **Add more stories**, or **Abort**
> - Ask: "What is the release version/tag? (e.g., v1.2.0)"

**Do NOT proceed past this gate without explicit user approval and a release version.**

---

### Phase 2 — Create Release Branch

5. Create the release branch from dev:
   ```bash
   git checkout dev && git pull origin dev
   git checkout -b release/{version}   # e.g., release/v1.2.0
   ```
6. Verify the release branch contains all expected story commits:
   ```bash
   git log master..release/{version} --oneline
   ```
7. **Sync GitHub**: Append a state comment on ALL included issues:
   ```
   **[orch-po] Phase 2 — Release Branch Created** · {timestamp}
   - Release: `release/{version}`
   - Bundle: {count} stories
   - Label added: `release-candidate`
   ```
   Then add label `release-candidate` to all included issues.

---

### Phase 3 — Automated Verification

8. Run the full test suite on the release branch:
   ```bash
   npm run test            # unit + component tests
   npm run test:e2e        # Playwright UI tests
   npm run typecheck
   npm run lint
   ```
9. Run a smoke test against the dev environment (where this code is already deployed):
   - Verify each story's primary user flow is working
   - Check for regressions in existing features
10. Present verification report:
    ```
    ## Automated Verification
    - **Unit tests**: ✅ {passed}/{total} / ❌ {failures}
    - **Playwright (e2e)**: ✅ {passed}/{total} / ❌ {failures}
    - **Type check**: ✅ / ❌
    - **Lint**: ✅ / ⚠️ {warnings}
    
    ## Smoke Test Results
    | Story | Primary Flow | Result |
    |-------|-------------|--------|
    | #{n} {spec} | {flow description} | ✅ / ❌ |
    ```
11. Hand off to **Reviewer Agent** for a final release review:
    - Check for any critical regressions
    - Verify no secrets or debug code in the release
    - Confirm all included stories have `qe-verified` label

---

### Phase 4 — Manual Verification

12. Present a release manual verification checklist:
    ```
    ## Release Manual Verification Checklist
    Please verify on the dev environment ({URL}) before production release:
    
    **Stories in this release:**
    {For each story}
    - [ ] #{n} {spec}: {primary acceptance criteria} — smoke test
    
    **Regression checks:**
    - [ ] Core application flows still working (login, main navigation, key features)
    - [ ] No visible UI regressions
    - [ ] Performance acceptable (pages load within expected time)
    
    **Data integrity:**
    - [ ] No unexpected database migrations or data changes required
    - [ ] All API contracts maintained
    ```

### 🧑 Human Gate 2 — Manual Verification Sign-off

> **Pause and ask the user:**
> - "Please perform the manual verification checklist above on: {dev-URL}"
> - "Confirm: all automated tests passing, manual checks done. Proceed to create production PR?"
> - If any automated tests failed: "These tests are failing: {list}. Block release or proceed?"
> - If manual issues found: "Manual check failures: {list}. Fix now (loop back), exclude story, or abort?"
> - Allow the user to: **Approve (create PR)**, **Fix issues first**, **Exclude a story from this release**, or **Abort**

**Do NOT proceed past this gate without explicit user approval and manual sign-off.**

---

### Phase 5 — Create PR to Master

13. Push the release branch:
    ```bash
    git push origin release/{version}
    ```
14. Create a Pull Request targeting master:
    ```bash
    gh pr create \
      --base master \
      --head release/{version} \
      --title "release({version}): {story count} stories" \
      --body "{PR body — see template below}"
    ```
    PR body must include:
    - Release version and date
    - **Stories included** (table: issue, spec, summary, ACs, QE sign-off date)
    - Automated test results summary
    - Manual verification sign-off confirmation
    - Deployment instructions / rollback plan
    - Links to all included spec files
15. **Sync GitHub**: Append a state comment on ALL included issues:
    ```
    **[orch-po] Phase 5 — Production PR Created** · {timestamp}
    - Release: `release/{version}`
    - PR: #{pr-number}
    - Status: awaiting final approval
    ```

### 🧑 Human Gate 3 — Final Production Merge Approval

> **Pause and ask the user:**
> - "Production PR #{pr-number} is ready. This will deploy to production. Final approval to merge and deploy?"
> - Show: PR link, release summary, included stories, test results
> - This is the LAST gate before production — be explicit
> - Allow the user to: **Approve (merge + deploy)**, **Wait (merge later manually)**, or **Abort**

**Do NOT proceed past this gate without explicit user approval. Production deploys are irreversible.**

---

### Phase 6 — Merge to Master & Deploy to Production

16. Merge the PR (squash or merge commit — use project convention):
    ```bash
    gh pr merge {pr-number} --merge --delete-branch
    # OR: --squash if project convention
    ```
17. Tag the release on master:
    ```bash
    git checkout master && git pull origin master
    git tag -a {version} -m "Release {version}"
    git push origin {version}
    ```
18. Trigger production deployment via `project-config.json` → `hosting.platform`:
    - **Vercel / Netlify**: Auto-triggers on master push — monitor status
    - **AWS/Custom**: Run `npm run deploy:prod` or equivalent
    - **GitHub Actions**: Trigger production workflow
    - **Manual**: Provide step-by-step deploy instructions and wait for confirmation
19. Monitor deployment and wait for completion

---

### Phase 7 — Post-Deploy Production Verification

20. Run smoke checks against the production URL:
    - Verify the app loads without errors
    - Spot-check each released story's primary flow
    - Check for 500 errors, broken assets, or console errors
21. Present post-deploy report:
    ```
    ## Production Deployment
    - **Version**: {version}
    - **URL**: {production URL}
    - **Deploy status**: ✅ Successful / ❌ Failed
    - **Smoke checks**: {passed}/{total}
    ```
22. If critical issues found in production: immediately execute the rollback plan

---

### Phase 8 — Move to Done

23. Update spec status to `completed` for all included specs
24. **Sync GitHub**: Append a final state comment on ALL included issues:
    ```
    **[orch-po] Phase 8 — Deployed to Production → Done** · {timestamp}
    - Release: `release/{version}`
    - Production URL: {URL}
    - Deploy: ✅ successful
    - Spec status: completed
    - Column: moved to **Done**
    ```
    Then for each included issue:
    - Label → `deployed-prod`, remove `release-candidate`, `qe-verified`
    - Close the issue
    - Move issue card to **Done** column on Projects board
25. Present final summary:
    ```
    ## Release Deployed ✅
    - **Version**: {version}
    - **PR**: #{number} merged to master
    - **Production**: {URL}
    - **Stories shipped**: {count}
    
    | Issue | Spec | ACs | Status |
    |-------|------|-----|--------|
    | #{n} | {spec} | {X}/{Y} | ✅ Done |
    
    🎉 Release complete — all stories moved from Ready To Deploy to Done.
    ```

## Error Recovery

- If automation tests fail on release branch: investigate if regression from a specific story; offer to exclude that story and re-bundle
- If manual verification reveals a bug: create a new GitHub issue tagged `bug`, decide whether to block the release or ship a hotfix separately
- If deploy fails: execute rollback plan immediately, reopen all included issues, reset column back to **Ready To Deploy**
- If production smoke checks fail: same as deploy failure — rollback immediately
- At any point the user can say "abort" to stop the orchestration

## Rollback Plan

If production deployment causes issues:
1. `git revert {merge-commit} --no-edit`
2. `git push origin master`
3. Delete the tag: `git push origin --delete {version}`
4. Trigger a rollback deploy (or auto-triggers on the reverted push)
5. Reopen all included GitHub issues
6. Move all issues back to **Ready To Deploy** column
7. Label → remove `deployed-prod`, add `release-blocked`
8. Post a rollback comment on all issues explaining the failure

## Constraints

- ALWAYS pause at all three human gates — gates 2 and 3 are production-critical
- ALWAYS run full test suite before creating the production PR
- ALWAYS create a release branch from dev — never commit directly to master
- ALWAYS tag the release in git
- ALWAYS append state comments on ALL included issues — never overwrite
- ALWAYS have a rollback plan confirmed before deploying
- NEVER skip manual verification sign-off (Gate 2)
- NEVER deploy stories that are not `qe-verified`
- NEVER force push to master
- Track every phase in the todo list so the user sees progress
