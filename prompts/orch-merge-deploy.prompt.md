---
description: "Orchestrated: Merge verified feature branch to dev and deploy — with human approval before merge and deploy"
tools: [read, search, edit, execute, todo, github/*]
agents: [github-sync, reviewer]
argument-hint: "Spec name or branch name (e.g., 'rh-long' or 'feature/rh-long')"
---

Merge a verified feature to the dev branch and deploy — with human gates before merge and deploy.

## Orchestration Flow

```
[1. Pre-flight Checks] → 🧑 HIL → [2. Create PR & Merge] → 🧑 HIL → [3. Deploy to Dev] → [4. Post-Deploy Verify]
```

## Instructions

### Phase 1 — Pre-flight Checks

1. Identify the target spec and its feature branch:
   - If argument is a spec name: read `specs/{name}/spec.md`, derive branch name
   - If argument is a branch name: identify the associated spec
   - If no argument: scan for specs with `status: verified` and list them
2. Validate readiness:
   - Spec status must be `verified` or `implemented` with passing review
   - Check the feature branch exists: `git branch --list 'feature/{spec-name}*'`
   - Check for uncommitted changes: `git status`
   - Check branch is up to date with dev: `git log dev..HEAD --oneline`
3. Run final sanity checks:
   - `npm run typecheck` (or project equivalent) — must pass
   - `npm run test` (or project equivalent) — must pass
   - `npm run lint` (or project equivalent) — should pass (warnings OK)
4. Present pre-flight report:
   ```
   ## Pre-flight Report
   - **Spec**: {name} (status: {status})
   - **Branch**: {branch} ({N} commits ahead of dev)
   - **Type check**: ✅ / ❌
   - **Tests**: ✅ {passed}/{total} / ❌ {failures}
   - **Lint**: ✅ / ⚠️ {warnings}
   - **Uncommitted changes**: None / ⚠️ {count} files
   - **Conflicts with dev**: None / ⚠️ {details}
   ```

### 🧑 Human Gate 1 — Approve Merge

> **Pause and ask the user:**
> - "Pre-flight checks complete. Ready to create PR and merge to dev?"
> - If any checks failed: "These checks did not pass: {list}. Proceed anyway or fix first?"
> - If conflicts detected: "Merge conflicts found with dev. Resolve first?"
> - Allow the user to: **Approve merge**, **Fix issues first**, or **Abort**

**Do NOT proceed past this gate without explicit user approval.**

---

### Phase 2 — Create PR & Merge to Dev

5. Ensure all changes are committed:
   - Stage any remaining changes: `git add -A`
   - Commit with message: `feat({spec-name}): implement {spec title}`
6. Push the feature branch: `git push origin {branch}`
7. Create a Pull Request via GitHub CLI:
   ```bash
   gh pr create \
     --base dev \
     --head {branch} \
     --title "feat({spec-name}): {spec title}" \
     --body "{PR body with AC checklist and test results}"
   ```
8. If CI checks are configured, wait for them (or note status)
9. Merge the PR:
   ```bash
   gh pr merge {pr-number} --squash --delete-branch
   ```
10. Update local dev branch:
    ```bash
    git checkout dev && git pull origin dev
    ```
11. Report merge result:
    ```
    ## Merge Complete
    - **PR**: #{number} — {title}
    - **Merged to**: dev
    - **Method**: squash merge
    - **Branch cleaned up**: ✅
    ```

### 🧑 Human Gate 2 — Approve Deployment

> **Pause and ask the user:**
> - "Code is merged to dev. Ready to deploy to the dev environment?"
> - Show the deployment target and what will change
> - Allow the user to: **Deploy now**, **Skip deploy** (just merge was needed), or **Abort**

**Do NOT proceed past this gate without explicit user approval.**

---

### Phase 3 — Deploy to Dev Environment

12. Determine the deploy mechanism from `project-config.json` → `hosting.platform` and `hosting.cicd`:
    - **Vercel**: Deployment auto-triggers on push to dev, just verify status
    - **Netlify**: Same — verify deploy status via CLI or dashboard
    - **AWS/Custom**: Run the deploy script (e.g., `npm run deploy:dev`)
    - **GitHub Actions**: Trigger workflow if not auto-triggered
    - **Manual**: Provide the user with deploy instructions
13. Monitor deployment:
    ```bash
    # Example for Vercel
    vercel --prod=false    # deploys preview/dev
    # Or check CI/CD status
    gh run list --branch dev --limit 1
    ```
14. Wait for deployment to complete (with timeout)

---

### Phase 4 — Post-Deploy Verification

15. Run smoke checks if a dev URL is available:
    - Verify the app loads without errors
    - Check the deployed feature is accessible
16. Update spec status to `completed`
17. **Sync GitHub**:
    - Close the linked issue
    - Remove all spec workflow labels
    - Comment: "Deployed to dev environment. Feature delivered. ✅"
    - Move to "Done" column on Projects board
18. Present final summary:
    ```
    ## Deployment Complete ✅
    - **Spec**: {name}
    - **PR**: #{number} merged to dev
    - **Deploy**: {environment URL or status}
    - **GitHub Issue**: #{issue} — Closed
    - **Spec status**: completed
    
    🎉 Story fully delivered from To Do → Done
    ```

## Error Recovery

- If pre-flight checks fail: report specifics, offer to fix or skip
- If merge conflicts: present conflict files, ask user to resolve manually or attempt auto-resolve
- If PR creation fails: check `gh` CLI auth, offer manual PR link
- If deployment fails: show error logs, suggest rollback with `git revert`, ask user
- At any point the user can say "abort" to stop the orchestration

## Rollback Plan

If deployment causes issues:
1. `git revert {merge-commit} --no-edit`
2. `git push origin dev`
3. Re-deploy dev branch
4. Reopen the GitHub issue
5. Reset spec status to `verified`

## Constraints

- ALWAYS pause at both human gates — never auto-merge or auto-deploy
- ALWAYS show the diff summary before merging
- ALWAYS use squash merge to keep dev history clean
- NEVER force push to dev
- NEVER deploy to production — this prompt targets dev environment only
- NEVER skip pre-flight checks
- Track every phase in the todo list so the user sees progress
