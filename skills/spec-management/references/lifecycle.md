# Spec Lifecycle

## Status Transitions

```
draft ──► review ──► approved ──► in-progress ──► implemented ──► verified ──► completed
  │          │           │                              │              │
  ▼          ▼           ▼                              ▼              ▼
disabled  disabled    disabled                       disabled       disabled
```

## Transition Rules

| From | To | Trigger | Requires Human | GitHub Sync |
|------|-----|---------|----------------|-------------|
| (new) | draft | Agent creates spec | No | Add label `spec-draft`, comment with spec link |
| draft | review | Agent completes all 4 files | No | Add label `spec-review`, remove `spec-draft` |
| review | approved | Human reviews and approves | **Yes** | Add label `spec-approved`, remove `spec-review` |
| review | draft | Human requests changes | **Yes** | Add label `spec-draft`, remove `spec-review`, comment with requested changes |
| approved | in-progress | Coder starts implementation | No | Add label `in-progress`, remove `spec-approved` |
| in-progress | implemented | Coder finishes all ACs | No | Add label `needs-review`, remove `in-progress` |
| implemented | verified | QA runs tests, all pass | No | Add label `verified`, remove `needs-review` |
| verified | completed | Reviewer approves + human confirms | **Yes** | Close issue, remove all spec labels |
| any | disabled | Human decision | **Yes** | Add label `disabled`, close issue as not-planned |

## GitHub Sync Rules

Every spec status change MUST be accompanied by a GitHub issue update:

1. **Label swap**: Remove the old status label, add the new one (see label map below)
2. **Comment**: Add a status-change comment with the agent name and timestamp
3. **Assignment**: Update issue assignee to match the current owner (see Status Semantics)
4. **Project board**: Move the issue card to the matching column (Backlog → Ready → In progress → In review → Done)
5. **Column limits**: Respect WIP limits — Backlog (3), In progress (3), In review (5). If a column is at capacity, flag it in the comment

### Label Map

Mapped to the GitHub Projects board columns: **Backlog → Ready → In progress → In review → Done**

| Spec Status | GitHub Label | GitHub Project Column | Column Limit |
|-------------|-------------|----------------------|-------------|
| `draft` | `spec-draft` | Backlog | 3 |
| `review` | `spec-review` | Backlog | 3 |
| `approved` | `spec-approved` | Ready | — |
| `in-progress` | `in-progress` | In progress | 3 |
| `implemented` | `needs-review` | In review | 5 |
| `verified` | `verified` | In review | 5 |
| `completed` | *(issue closed)* | Done | — |
| `disabled` | `disabled` | *(issue closed as not-planned)* | — |

> **Note**: `draft` and `review` both map to **Backlog** — use labels to distinguish them.
> `implemented` and `verified` both map to **In review** — use labels to distinguish QA vs final review.

### Comment Template

When updating a GitHub issue on status change, use:

```
**Status → {new_status}**
Agent: {agent_name}
Spec: `specs/{feature-name}/spec.md`
Timestamp: {ISO 8601}
{optional_notes}
```

## Human-in-the-Loop Gates

Three mandatory human checkpoints:

1. **Approval Gate** (`review` → `approved`): Human verifies the spec matches intent
2. **Completion Gate** (`verified` → `completed`): Human confirms feature ships
3. **Disable Gate** (any → `disabled`): Human decides to pause/remove a feature

## Status Semantics

| Status | Who Owns It | What Happens | GitHub Assignee |
|--------|-------------|--------------|-----------------|
| `draft` | Planner | Creating/refining spec files | Planner / Author |
| `review` | Human | Waiting for human approval | Human reviewer |
| `approved` | Coder | Ready for implementation | Coder / Unassigned |
| `in-progress` | Coder | Actively being built | Coder |
| `implemented` | QA Engineer | Code done, needs testing | QA Engineer |
| `verified` | Reviewer | Tests pass, needs final review | Reviewer |
| `completed` | Nobody | Done, shipped | *(unassigned)* |
| `disabled` | Nobody | Deactivated, kept for history | *(unassigned)* |
