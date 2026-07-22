---
date: YYYY-MM-DD
framework: ""       # e.g. jest, vitest, playwright, cypress
area: ""            # feature/component area the test covers
tags: []            # greppable keywords: symptom, error message, test file path
fix_type: stabilized  # stabilized | re-enabled | quarantined | deleted | workaround
test_files: []      # exact test file paths touched
github_issue: ""    # e.g. "#42" — leave empty if none
related: []         # other knowledge-base entries
---

# <Short test-fix title>

## Symptom

<!-- How the test failed: flaky vs consistent, error output, CI vs local -->

## Root Cause

<!-- The actual cause — race, shared state, timing, selector, env. Never just "flaky" -->

## Fix

<!-- What changed and why it stabilizes the test. If quarantined/deleted, justify and note the coverage gap -->

## Verification

<!-- Proof of stability: e.g. N consecutive passes locally and in CI -->

## Pattern

<!-- Reusable takeaway. If it's a durable testing pattern, ask @knowledge-base to add it to repo-knowledge/testing-patterns.md and cross-link -->
