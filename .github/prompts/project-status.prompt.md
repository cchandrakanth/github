---
description: "Show status of all specs, in-progress work, and project health dashboard"
tools: [read, search]
---

Generate a project status report.

## Instructions

1. Read all specs in `specs/*/spec.md`
2. Group by status: draft, review, approved, in-progress, implemented, verified, completed, disabled
3. For in-progress specs, show which ACs are done
4. Count total specs, completion rate
5. Flag any specs stuck in a status for too long (> 7 days unchanged)
6. Check GitHub sync status: for specs with `github_issue` field, verify the linked issue label matches the spec status

## Output Format

```
## Project Status — {date}

### Board Summary (Backlog → Ready → In progress → In review → Done)
| Column | Limit | Count | Specs |
|--------|-------|-------|-------|
| Backlog | 3 | N | draft: spec1, review: spec2 |
| Ready | — | N | spec3 |
| In progress | 3 | N | spec4 |
| In review | 5 | N | spec5 (QA), spec6 (review) |
| Done | — | N | spec7, spec8 |

### In Progress Details
- **{spec}**: {X}/{Y} ACs complete — Owner: {agent}

### GitHub Sync Status
- **{spec}**: spec={status}, issue=#{number} label={label}, column={column} ✅ in-sync | ⚠️ out-of-sync

### Blocked / Stale
- **{spec}**: Stuck in {status} since {date}

### WIP Alerts
- ⚠️ {column} at capacity ({count}/{limit})
```
