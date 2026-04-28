---
date: YYYY-MM-DD
title: <one-line summary>
test_type: unit | integration | e2e | component
framework: <vitest | jest | playwright | cypress | …>
tags: [flake, selector, mock, timing, env]
fix_type: stabilized | re-enabled | quarantined | deleted | workaround
test_files: []
related_spec: <specs/<feature>/ or null>
github_issue: <#NN or null>
---

# <Title>

## Failing test(s)
- `path/to/test:line` — last failure message / stack

## Failure pattern
- Frequency: always | intermittent (X / Y runs) | env-specific
- First seen: <date or commit>
- Symptom: timeout | wrong selector | mock mismatch | race | …

## Root Cause
Specific. Don't write "flaky" — explain *why* it was flaky.

## Fix
What changed in the test (or in the code under test). Include snippets.

```diff
- old
+ new
```

## Verification
- Re-ran N times locally: pass
- Re-ran N times on CI: pass
- Run with `--repeat-each=N` (Playwright) or equivalent: pass

## Prevention
- Pattern documented in: `repo-knowledge/testing-patterns.md`
- Lint / fixture / helper added: …

## See also
- Related test fixes: `automation-test-fixes/<file>.md`
