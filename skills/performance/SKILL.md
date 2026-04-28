---
name: performance
description: "Analyze and optimize application performance. Use when auditing bundle size, render performance, API latency, database query efficiency, or Lighthouse scores."
argument-hint: "Page path or feature name to audit"
---

# Performance Skill

## When to Use

- After implementing a feature (pre-merge audit)
- When Lighthouse scores drop below target
- When page load feels slow
- When bundle size grows unexpectedly

## Procedure

### Quick Check

Run the project's build command and analyze output sizes. Run type check to catch unused imports.

### Full Audit

1. Read [performance checklist](./references/checklist.md)
2. Check each item against the target code
3. Run build and analyze output sizes
4. Report findings with estimated impact

## References

- [Performance Checklist](./references/checklist.md)
