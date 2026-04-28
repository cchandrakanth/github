---
date: YYYY-MM-DD
title: <one-line summary>
tags: [area, component, error-type]
severity: low | medium | high | critical
github_issue: <#NN or null>
related_spec: <specs/<feature>/ or null>
fix_type: true-fix | workaround | revert
files_changed: []
---

# <Title>

## Symptom
What the user / system saw. Include exact error messages, stack traces, or reproduction steps.

## Root Cause
Why it happened. Be specific — name the function, condition, or assumption that broke.

## Fix
What changed. Reference commit SHA(s) if available. Include before/after snippets when helpful.

```diff
- old
+ new
```

## Verification
How we confirmed the fix:
- Test added: `path/to/test`
- Manual repro re-run: pass
- Regression suite: pass

## Prevention
What we changed (or should change) so this class of bug doesn't recur:
- New test / lint rule / type guard
- Repo-knowledge entry added: `repo-knowledge/<file>.md`
- Follow-up issue: #NN

## See also
- Related fixes: `fix-history/<file>.md`
