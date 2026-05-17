---
description: "Orchestrated: Code review, create PR, merge feature branch to dev, and move story to Testing — with human approval gates"
tools: [read, search, edit, execute, todo, github/*]
agents: [github-sync, reviewer]
argument-hint: "Spec name, branch name, or GitHub issue number (e.g., 'rh-long', 'story/42-rh-long', or '#42')"
---

Code review, PR creation, and dev branch merge — from **Developed → Testing**, with human gates.

**Swim lane**: `Developed` → `Testing`
**Stateful**: Re-running on the same issue resumes from the last recorded phase. Each phase appends a timestamped comment to the GitHub issue — nothing is overwritten.

> **Scope**: This prompt reviews code, creates a PR, and merges the feature branch into dev. Playwright/integration QE testing is handled downstream by `orch-qe`. Production deploy is handled by `orch-po`.

## Orchestration Flow

```
[1. Resume Check] → [2. Pre-flight] → 🧑 HIL → [3. Code Review] → [4. Create PR & Merge to Dev] → 🧑 HIL → [5. Deploy to Dev] → [6. Move to Testing]
```

## Instructions

### Phase 0 — Resume Check (Stateful)

> **First**: Read `project-config.json` → `github.repository`.

If an issue number or branch was provided, fetch the issue and scan its comments for any prior `[orch-merge-deploy]` state comments.
- If a prior state comment is found → display the last recorded phase and ask:
  > "This story was last worked on at Phase {N} ({description}). Resume from there, restart from the beginning, or abort?"
- If no prior state → proceed to Phase 1.

**State is always appended as a new comment, never edited.** Use this format for every state update:
```
**[orch-merge-deploy] Phase {N} — {phase name}** · {ISO timestamp}
- Status: in-progress | completed | blocked
- Notes: {brief summary}
```

---

### Phase 1 — Pre-flight Checks

1. Identify the target spec and its feature branch:
   - If argument is an issue number: validate repo scope, read `specs/{name}/spec.md`, derive branch name
   - If argument is a spec name: read `specs/{name}/spec.md`, derive branch name
   - If argument is a branch name: identify the associated spec and GitHub issue
   - If no argument: scan GitHub Projects **Developed** column filtered to `github.repository` and list candidates
2. Validate readiness:
   - Spec status must be `implemented`
   - Check the feature branch exists: `git branch --list '{branch}'`
   - Check for uncommitted changes: `git status`
   - Check branch is up to date with dev: `git log dev..{branch} --oneline`
3. Run final sanity checks:
   - `npm run typecheck` (or project equivalent) — must pass
   - `npm run test` (or project equivalent) — must pass
   - `npm run lint` (or project equivalent) — should pass (warnings OK)
4. Present pre-flight report:
   ```
   ## Pre-flight Report
   - **Spec**: {name} (status: {status})
   - **Branch**: {branch} ({N} commits ahead of dev)
   - **GitHub Issue**: #{number}
   - **Type check**: ✅ / ❌
   - **Unit tests**: ✅ {passed}/{total} / ❌ {failures}
   - **Lint**: ✅ / ⚠️ {warnings}
   - **Uncommitted changes**: None / ⚠️ {count} files
   - **Conflicts with dev**: None / ⚠️ {details}
   ```

---

### Phase 2 — Code Review (Reviewer Agent)

5. Hand off to **Reviewer Agent** to run the review checklist:
   - Spec compliance (every AC implemented)
   - Code quality and standards
   - Security rules (OWASP Top 10)
   - Performance checks
   - Responsive design
6. Present review findings:
   ```
   ## Review Findings
   | # | Severity | Finding | Location |
   |---|----------|---------|----------|
   | 1 | critical/warning/info | {description} | {file:line} |
   
   Verdict: ✅ Approved / ⚠️ Needs Changes
   ```
7. If critical findings exist, list them clearly and ask user whether to fix before proceeding

### 🧑 Human Gate 1 — Approve Review & Merge

> **Pause and ask the user:**
> - "Pre-flight and code review complete. Ready to create PR and merge to dev?"
> - Show: review verdict, any critical findings, test summary
> - If checks failed or critical findings: "These issues were found: {list}. Fix first or proceed anyway?"
> - If conflicts detected: "Merge conflicts found with dev. Resolve first?"
> - Allow the user to: **Approve merge**, **Fix issues first**, or **Abort**

**Do NOT proceed past this gate without explicit user approval.**

---

### Phase 3 — Create PR & Merge to Dev

8. Ensure all changes are committed:
   - Stage any remaining changes: `git add -A`
   - Commit with message: `feat({spec-name}): implement {spec title}`
9. Push the feature branch: `git push origin {branch}`
10. Create a Pull Request via GitHub CLI:
    ```bash
    gh pr create \
      --base dev \
      --head {branch} \
      --title "feat({spec-name}): {spec title} (#{issue})" \
      --body "{PR body — see template below}"
    ```
    PR body must include:
    - Linked issue (`Closes #<issue>` — moves to closed on merge)
    - AC checklist with implementation status
    - Unit test summary
    - Review verdict and any accepted warnings
    - Note: "Playwright/integration tests will be added by `orch-qe`"
11. **Sync GitHub**: Append a state comment to the issue:
    ```
    **[orch-merge-deploy] Phase 3 — PR Created** · {timestamp}
    - Status: in-progress
    - PR: #{pr-number}
    - Branch: `{branch}` → `dev`
    ```
12. Merge the PR (squash):
    ```bash
    gh pr merge {pr-number} --squash --delete-branch
    ```
13. Update local dev branch:
    ```bash
    git checkout dev && git pull origin dev
    ```
14. Report merge result:
    ```
    ## Merge Complete
    - **PR**: #{number} — {title}
    - **Merged to**: dev
    - **Method**: squash merge
    - **Branch cleaned up**: ✅
    ```

### 🧑 Human Gate 2 — Approve Deployment to Dev

> **Pause and ask the user:**
> - "Code is merged to dev. Ready to deploy to the dev environment?"
> - Show the deployment target and what will change
> - Allow the user to: **Deploy now**, **Skip deploy** (just merge was needed), or **Abort**

**Do NOT proceed past this gate without explicit user approval.**

---

### Phase 4 — Deploy to Dev Environment

15. Determine the deploy mechanism from `project-config.json` → `hosting.platform` and `hosting.cicd`:
    - **Vercel**: Deployment auto-triggers on push to dev — verify status
    - **Netlify**: Same — verify deploy status via CLI or dashboard
    - **AWS/Custom**: Run the deploy script (e.g., `npm run deploy:dev`)
    - **GitHub Actions**: Trigger workflow if not auto-triggered
    - **Manual**: Provide the user with deploy instructions
16. Monitor deployment and wait for completion (with timeout)

---

### Phase 5 — Move to Testing

17. **Sync GitHub**: Append a state comment to the issue:
    ```
    **[orch-merge-deploy] Phase 5 — Deployed to Dev → Testing** · {timestamp}
    - Status: completed
    - PR: #{pr-number} merged to dev
    - Dev deploy: {URL or CI link}
    - Column: moved to **Testing**
    - Next: run `orch-qe` to create Playwright tests and run full QE validation
    ```
    Then:
    - Label → `deployed-dev`, remove `implemented`
    - Move issue card to **Testing** column on Projects board
18. Present final summary:
    ```
    ## Deployed to Dev ✅
    - **Spec**: {name}
    - **PR**: #{number} merged to dev
    - **Dev deploy**: {environment URL or status}
    - **Review**: {verdict}
    - **GitHub Issue**: #{number} → Testing column
    
    ➡️ Next: Run `orch-qe` to create Playwright/integration tests and validate the deployed feature.
    ```

## Error Recovery

- If pre-flight checks fail: report specifics, offer to fix or skip
- If code review finds critical issues: loop back to `orch-deliver-story` for targeted fixes
- If merge conflicts: present conflict files, ask user to resolve manually or attempt auto-resolve
- If PR creation fails: check `gh` CLI auth, offer manual PR link
- If deployment fails: show error logs, suggest rollback with `git revert`, ask user
- At any point the user can say "abort" to stop the orchestration

## Rollback Plan

If deployment causes issues:
1. `git revert {merge-commit} --no-edit`
2. `git push origin dev`
3. Re-deploy dev branch
4. Update GitHub issue back to **Developed** column
5. Reset spec status to `implemented`

## Constraints

- ALWAYS pause at both human gates — never auto-merge or auto-deploy
- ALWAYS show the review verdict before merging
- ALWAYS use squash merge to keep dev history clean
- ALWAYS append state comments — never overwrite previous state comments
- NEVER force push to dev
- NEVER deploy to production — this prompt targets dev environment only; production is `orch-po`
- NEVER skip pre-flight checks
- Track every phase in the todo list so the user sees progress
