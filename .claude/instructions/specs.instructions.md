---
description: "Use when creating or modifying spec files. Covers spec structure, status lifecycle, and required files."
applyTo: "specs/**"
---

# Spec File Standards

## Required Files Per Spec

Every spec in `specs/{feature-name}/` must have exactly 4 files:

1. **spec.md** — Status, user stories, acceptance criteria, edge cases, questions
2. **styles.md** — CSS locators, class names, responsive breakpoints, design tokens
3. **test.yml** — Automated test cases (unit, integration, e2e)
4. **schema.yml** — Database collections/tables, document/row shapes, indexes, access rules

## Status Lifecycle

```
draft → review → approved → in-progress → implemented → verified → completed
```

- `draft` — Initial creation, open for changes
- `review` — Submitted for human review
- `approved` — Human approved, ready for implementation
- `in-progress` — Actively being coded
- `implemented` — Code complete, awaiting test/review
- `verified` — Tests pass, security + performance reviewed
- `completed` — Shipped and marked done
- `disabled` — Spec deactivated (retained for history)

## Rules

- No code changes without an approved spec
- Spec status must be updated as work progresses
- Deleting a spec triggers cleanup of associated code, tests, and routes
- Questions in spec must be resolved before moving to `approved`
- Bug fixes that touch a spec append a row to the spec's `## Bug Fixes` table linking to a `knowledge-base/fix-history/` entry
- Bug-fix-only specs (no parent feature) live under `specs/bug-<slug>/`
