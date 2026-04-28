---
description: "Orchestrated bug fix: branch → diagnose → fix → update spec/tests → run tests → PR. Reads knowledge-base/fix-history first; writes & consolidates after."
tools: [read, search, edit, execute, todo, github/*]
agents: [bug-fixer, knowledge-base, coder, qa-engineer, planner, github-sync]
argument-hint: "GitHub issue number, bug description, or failing-test path (e.g., '#142' or 'login redirect loop')"
---

End-to-end bug fix — from a reported bug to a merged-ready PR — with knowledge-base read-first / write-after baked in.

## Orchestration Flow

```
[1. Intake & KB Search] → 🧑 HIL → [2. Diagnose & Plan] → [3. Fix Code] → [4. Update Spec] →
[5. Add/Update Tests & Run] → 🧑 HIL → [6. Record + Consolidate KB] → [7. Create PR]
```

## Instructions

> **First**: Read `project-config.json` for `github.repository`, `techStack.*`, `testing.*`, and `knowledgeBase.paths.*`. All issue + path operations derive from this config.

### Phase 1 — Intake & Knowledge-Base Search (Bug Fixer)

1. Resolve the input:
   - Issue number → fetch issue via GitHub MCP; validate repo scope (`github.repository` + `github.repositoryLabel`). If validation fails → **STOP** with the standard scope-violation message.
   - Free-text bug description or failing test path → capture as the symptom
2. Hand off to **`@bug-fixer`** to search prior fixes:
   - `grep_search` `knowledge-base/fix-history/` by error message, file path, symptom phrase, and `tags:`
   - Also search `knowledge-base/repo-knowledge/` for related conventions or known gotchas
3. Present an Intake Report:
   ```
   ## Bug Intake
   - **Source**: #{issue} | <description>
   - **Symptom**: <one line>
   - **Prior fix-history matches**: [list of entries] | none
   - **Related repo-knowledge**: [list] | none
   - **Suspected area**: <component / file / layer>
   ```

### 🧑 Human Gate 1 — Confirm Bug & Approach

> **Pause and ask the user:**
> - "Here's the bug intake and any prior fixes. Proceed with diagnosis?"
> - If a prior fix matches → "A similar bug was fixed before — apply the same pattern, or treat as new?"
> - Allow: **Approve**, **Adjust scope**, or **Abort**

**Do not proceed past this gate without explicit user approval.**

---

### Phase 2 — Branch & Diagnose

4. Create a fix branch from `dev`:
   ```bash
   git checkout dev && git pull origin dev
   git checkout -b fix/<issue-or-slug>
   ```
5. **`@bug-fixer`** reproduces the bug locally (or captures the failing test output) and identifies the root cause
6. Classify the fix: `true-fix` | `workaround` | `revert`
7. Decide spec impact:
   - **Existing spec** → update its `spec.md` (add a bug-fix note under the relevant AC, or add a new AC if behavior changes)
   - **No matching spec** → delegate to **`@planner`** to create a focused bug-fix spec under `specs/bug-<slug>/` with a single user story
8. Present a Diagnosis Report:
   ```
   ## Diagnosis
   - **Root cause**: <specific function / condition / assumption>
   - **Fix type**: true-fix | workaround | revert
   - **Spec impact**: update specs/<name>/ | new spec specs/bug-<slug>/
   - **Files to change**: [list]
   - **Test impact**: [files to add/modify]
   ```

---

### Phase 3 — Apply the Fix (Coder)

9. Hand off to **`@coder`** with the diagnosis to apply the code change
10. Run type check and lint:
    ```bash
    npm run typecheck && npm run lint   # or project equivalents
    ```
11. Commit: `fix(<area>): <one-line summary> (#<issue>)`

### Phase 4 — Update Spec

12. Update the affected spec:
    - Add a `## Bug Fixes` log entry in `spec.md` referencing the issue and the fix-history file (placeholder until Phase 6 writes the file)
    - If a new AC was added → tick its checkbox once verified by tests
    - Bump spec status if appropriate (do **not** auto-mark `completed`)
13. **Sync GitHub** via `@github-sync`: comment on the issue with branch name + fix summary

---

### Phase 5 — Tests (QA Engineer)

14. Hand off to **`@qa-engineer`**:
    - Add a **regression test** that fails before the fix and passes after (mandatory unless explicitly waived with reason)
    - Update `test.yml` to register the new test case under the relevant AC
    - Run the full impacted test suite (unit + integration + e2e for the affected area)
15. Present Test Report:
    ```
    ## Test Results
    - **Regression test**: <path> — ✅ pass (was ❌ before fix)
    - **Impacted suite**: {passed}/{total} passing
    - **Failures**: [list] | none
    ```

### 🧑 Human Gate 2 — Approve Fix & Tests

> **Pause and ask the user:**
> - "Fix is in, tests pass. Ready to record in knowledge base and open a PR?"
> - If any test failed: "These tests still fail: {list}. Loop back to Phase 3, accept as workaround, or abort?"
> - If `fix_type: workaround` → confirm the user accepts the debt being recorded
> - Allow: **Approve**, **Loop back**, or **Abort**

**Do not proceed past this gate without explicit user approval.**

---

### Phase 6 — Record & Consolidate Knowledge Base (Bug Fixer + Knowledge Base)

16. **`@bug-fixer`** writes a new entry under `knowledge-base/fix-history/YYYY-MM-DD-<slug>.md` using `TEMPLATE.md`:
    - Symptom, Root Cause, Fix (with diff), Verification, Prevention
    - Set `fix_type` honestly; tag thoroughly; link the GitHub issue + spec
17. **`@bug-fixer`** runs the **Consolidation step**:
    - Search `fix-history/` for duplicates / same class of bug
    - Merge exact duplicates; mark superseded entries; cross-link siblings
    - If ≥3 entries share the same root cause → hand off to **`@knowledge-base`** to extract the pattern into `knowledge-base/repo-knowledge/` and cross-link
18. Update the placeholder reference in the spec's `## Bug Fixes` log to point at the real fix-history filename
19. Commit the knowledge-base + spec updates: `docs(kb): record fix for #<issue> + consolidate`

---

### Phase 7 — Create PR

20. Push the branch:
    ```bash
    git push -u origin fix/<issue-or-slug>
    ```
21. Open the PR (base = `dev`):
    ```bash
    gh pr create --base dev --head fix/<issue-or-slug> \
      --title "fix(<area>): <summary> (#<issue>)" \
      --body "<PR body>"
    ```
    PR body must include:
    - Linked issue (`Fixes #<issue>`)
    - Root cause (one paragraph)
    - Fix summary (one paragraph)
    - Regression test path
    - Link to `knowledge-base/fix-history/<file>.md`
    - Spec(s) updated
    - Consolidation actions taken (if any)
22. **Sync GitHub** via `@github-sync`:
    - Comment on the issue with the PR link
    - Add label `has-fix-pr`
23. Present Final Summary:
    ```
    ## Bug Fix Delivered ✅
    - **Issue**: #<issue>
    - **Branch**: fix/<slug>
    - **PR**: #<pr-number>
    - **Fix type**: true-fix | workaround | revert
    - **Spec(s) updated**: [list]
    - **Regression test**: <path>
    - **KB entry**: knowledge-base/fix-history/<file>.md
    - **Consolidation**: none | merged <old> | superseded <old> | pattern extracted
    - **Next step**: Run `/orch-merge-deploy` once PR is reviewed
    ```

## Error Recovery

- Cannot reproduce → ask the user for more repro steps; do **not** guess a fix
- Regression test cannot be written → require an explicit user waiver; record the waiver in the KB entry under `Verification`
- Workaround applied → open a follow-up GitHub issue tagged `tech-debt` linked to the fix-history entry
- Conflicts with `dev` during PR creation → pause, ask the user how to rebase

## Constraints

- ALWAYS search `knowledge-base/fix-history/` and `knowledge-base/repo-knowledge/` **before** diagnosing
- ALWAYS write the fix-history entry **and** run consolidation before opening the PR
- ALWAYS add a failing-then-passing regression test, or record an explicit waiver
- NEVER mark a spec `completed` from this prompt — that's `/orch-merge-deploy`
- NEVER skip the human gates
- Track every phase in the todo list
