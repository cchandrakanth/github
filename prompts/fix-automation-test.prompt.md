---
description: "Fix a failing automation test: read fix history, think beyond it, stabilize the test, update fix history, open a PR."
tools: [read, search, edit, execute, todo, github/*]
agents: [test-fixer, knowledge-base, bug-fixer]
argument-hint: "Failing test path, test name, or CI run URL (e.g., 'e2e/login.spec.ts' or 'login should redirect on success')"
---

Fix one or more failing/flaky automation tests. Read prior fixes first, **think beyond them**, then fix, record, and PR.

## Flow

```
[1. Read Fix History] → [2. Think Beyond] → [3. Fix Tests] → [4. Verify Stability] →
[5. Update Fix History + Consolidate] → [6. Create PR]
```

## Instructions

> **First**: Read `project-config.json` for `testing.*`, `techStack.*`, `github.repository`, and `knowledgeBase.paths.automationTestFixes`.

### 1. Read Fix History (always first)

Hand off to **`@test-fixer`** to:
- Run the failing test locally and capture the exact error + stack
- Extract keywords: test name, framework, error message, selector, symptom (timeout / mock mismatch / race / env)
- `grep_search` `knowledge-base/automation-test-fixes/` by those keywords and by `tags:` frontmatter
- `grep_search` `knowledge-base/repo-knowledge/testing-patterns.md` (if it exists) for relevant patterns

Output a short report:
```
## Prior Matches
- <YYYY-MM-DD-slug.md> — <one-line summary> — fix_type: <type>
- <YYYY-MM-DD-slug.md> — …
- (none) — no prior matches
```

### 2. Think Beyond

Do **not** stop at "apply the prior fix". Even if a prior fix matches, ask:
- Is the **same root cause** present, or just the same symptom?
- Has the framework / dependency / DOM / API changed since the prior fix?
- Is there a **better** fix now (e.g., proper auto-wait instead of the old `sleep()` workaround)?
- Could this failure be hiding a **real product bug**? — if yes, **STOP this prompt** and hand off to `/orch-fix-bug` with the failing test as input.
- Is there a **class of tests** likely affected by the same cause that we should fix together?

Write a short Hypothesis block:
```
## Hypothesis
- Likely root cause: <specific>
- Why prior fix is/isn't sufficient: <reason>
- Better approach considered: <approach or "prior fix is still optimal">
- Sibling tests at risk: [list] | none
- Real product bug? yes → escalate to /orch-fix-bug | no
```

### 3. Fix the Test(s)

Apply the fix in a branch:
```bash
git checkout dev && git pull origin dev
git checkout -b fix-tests/<slug>
```

Rules:
- Prefer fixing the **test**; only modify production code if a real bug is exposed (then escalate to `@bug-fixer`)
- Avoid anti-patterns: blanket `sleep()`, broad `try/catch`, retry loops, increased timeouts without justification
- If a true fix isn't feasible right now → quarantine with a `// FIXME(<date>, #<issue>)` comment and record as `fix_type: workaround` or `quarantined`
- Apply the fix to **sibling tests at risk** (from the Hypothesis block) in the same PR when reasonable

### 4. Verify Stability

Re-run the test(s) repeatedly:
- Local: ≥5 runs
- CI / `--repeat-each` equivalent: ≥5 runs

Record the stability check (N/N pass) for the fix-history entry. Do **not** proceed if any run fails.

### 5. Update Fix History + Consolidate

**`@test-fixer`** writes a new entry under `knowledge-base/automation-test-fixes/YYYY-MM-DD-<slug>.md` using `TEMPLATE.md`:
- Failing test(s), Failure pattern, Root Cause (specific — never just "flaky"), Fix (with diff), Verification (N/N pass), Prevention
- Set `fix_type` honestly; tag with framework + symptom + area
- Link the GitHub issue (if any) and any sibling tests fixed in the same PR

Then run **Consolidation**:
- Merge exact duplicates into the older entry; delete the newer
- Mark superseded entries `status: superseded_by: <new file>` with a forward link
- Add `## See also` cross-links between same-pattern siblings
- If ≥3 entries share the same symptom → hand off to **`@knowledge-base`** to promote the pattern into `knowledge-base/repo-knowledge/testing-patterns.md` and cross-link all of them

Commit: `test(<area>): stabilize <test name> + record + consolidate`

### 6. Create PR

```bash
git push -u origin fix-tests/<slug>
gh pr create --base dev --head fix-tests/<slug> \
  --title "test(<area>): stabilize <test name>" \
  --body "<PR body>"
```

PR body must include:
- Failing test(s) and prior failure pattern
- Root cause (one paragraph) — specific, not "flaky"
- Fix summary
- Stability check result (N/N local, N/N CI)
- `fix_type` and any debt opened (link follow-up issue if `workaround` / `quarantined`)
- Link to `knowledge-base/automation-test-fixes/<file>.md`
- Consolidation actions taken

Final Summary:
```
## Test Fix Delivered ✅
- **Tests**: [paths]
- **Branch**: fix-tests/<slug>
- **PR**: #<pr-number>
- **Fix type**: stabilized | re-enabled | quarantined | deleted | workaround
- **Stability**: local N/N · CI N/N
- **KB entry**: knowledge-base/automation-test-fixes/<file>.md
- **Consolidation**: none | merged <old> | superseded <old> | pattern extracted
- **Follow-up issue**: #<NN> | none
```

## Constraints

- ALWAYS search fix history **first** and write a Hypothesis block before changing code
- NEVER write off a failure as just "flaky" — name the specific cause
- NEVER add `sleep()` / arbitrary timeouts as a fix without recording it as `fix_type: workaround` and opening a follow-up issue
- NEVER delete or quarantine a test without recording why and updating the related spec's `test.yml`
- If the test exposes a real product bug → STOP and escalate to `/orch-fix-bug`
- ALWAYS update fix history **and** consolidate before opening the PR
