---
title: "{Short description of the bug}"
date: {YYYY-MM-DD}
fix_type: true-fix | workaround | revert
tags: [{keyword1}, {keyword2}]
affected_files: ["src/{path}"]
related_specs: ["specs/{feature-name}/spec.md"]
related_issues: ["#{NN}"]
---

# {Short description of the bug}

## Symptom

{Observable behavior — error message, crash, wrong output. Paste the exact error text so grep finds it.}

## Root Cause

{The actual underlying cause, not just where it surfaced.}

## Fix

{What was changed and why it resolves the root cause. For workarounds: what the proper fix would be and why it wasn't done now.}

## Prevention

{Regression test added (link test.yml id), lint rule, or convention that stops recurrence.}

## Links

- Spec `## Bug Fixes` row: specs/{feature-name}/spec.md
- {Issue / PR / related KB entries}
