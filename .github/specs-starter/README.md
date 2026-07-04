# Spec-Driven Development

## Overview

Every feature, bug fix, or change in this project follows the spec-driven development lifecycle. No code is written without an approved spec.

## Directory Structure

```
specs/
├── README.md              # This file
├── {feature-name}/        # One folder per feature spec
│   ├── spec.md            # Requirements, user stories, ACs
│   ├── styles.md          # CSS, layout, responsive design
│   ├── test.yml           # Test cases mapped to ACs
│   └── schema.yml         # Database schema changes
└── templates/             # Templates for creating new specs
    ├── spec.template.md
    ├── styles.template.md
    ├── test.template.yml
    └── schema.template.yml
```

## Lifecycle

```
draft → review → approved → in-progress → implemented → verified → completed
```

| Status | Owner | Description | GitHub Board Column |
|--------|-------|-------------|--------------------|
| `draft` | Planner Agent | Spec being written, questions open | Backlog |
| `review` | Human | Waiting for human approval | Backlog |
| `approved` | Coder Agent | Ready for implementation | Ready |
| `in-progress` | Coder Agent | Actively being built | In progress |
| `implemented` | QA Agent | Code done, needs testing | In review |
| `verified` | Reviewer Agent | Tests pass, needs final review | In review |
| `completed` | — | Shipped | Done |
| `disabled` | — | Deactivated | *(closed)* |

> Every spec status change syncs to GitHub Issues — labels, board column, assignee, and a status comment. See `skills/spec-management/references/lifecycle.md` for full rules.

## Human-in-the-Loop Gates

Three mandatory human checkpoints:

1. **`review` → `approved`**: Human verifies spec matches intent
2. **`verified` → `completed`**: Human confirms feature ships
3. **Any → `disabled`**: Human decides to pause/remove

## Quick Commands

| Action | How |
|--------|-----|
| Create new spec | `/new-spec` in chat or invoke `@planner` |
| Implement spec | `/implement-spec {name}` or invoke `@coder` |
| Review spec | `/review-spec {name}` or invoke `@reviewer` |
| Test spec | `/test-spec {name}` or invoke `@qa-engineer` |
| Security audit | `/security-audit {scope}` or invoke `@security` |
| Project status | `/project-status` |
| Fix a bug end-to-end | `/orch-fix-bug {issue or description}` |
| Stabilize a flaky test | `/fix-automation-test {test path}` |

## Bug-Fix Specs

Non-trivial bug fixes get their own spec when no parent feature spec exists. Convention:

- Folder: `specs/bug-<slug>/` (e.g., `specs/bug-login-redirect-loop/`)
- Single user story describing the **buggy behavior → expected behavior**
- Each AC maps to a regression test in `test.yml`
- `## Bug Fixes` log links the `knowledge-base/fix-history/` entry

For bugs that affect an existing feature spec, prefer adding the entry to that spec's `## Bug Fixes` log instead of creating a separate `bug-` spec.

## Knowledge Base Integration

Specs cross-link to the project's persistent memory at `knowledge-base/`:

- `knowledge-base/repo-knowledge/` — architecture / conventions cited in `## Dependencies` or `## Change Log`
- `knowledge-base/fix-history/` — entries linked from each spec's `## Bug Fixes` table
- `knowledge-base/automation-test-fixes/` — entries linked from `test.yml` notes when a test was stabilized

See the kit-level `knowledge-base/README.md` for the full layout and "when to add an entry" rules.
