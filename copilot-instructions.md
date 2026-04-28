# Project Instructions

> **All project-specific values are defined in `project-config.json` at the repo root.**
> Agents, instructions, and prompts MUST read `project-config.json` to resolve technology choices, conventions, and project metadata. Do not hardcode technology-specific values — always derive them from the config.

## Organization Intent

Read from `project-config.json` → `project.name` and `project.description`.

## Tech Stack

Read from `project-config.json` → `techStack.*`, `database.*`, `auth.*`, `ui.*`, `hosting.*`, `testing.*`.

| Layer | Config Key |
|-------|-----------|
| Language | `techStack.language` |
| Frontend | `techStack.frontend` |
| Mobile | `techStack.mobile` |
| Backend | `techStack.backend` |
| Serverless | `techStack.serverless` |
| Database | `database.primary` |
| ORM / Client | `database.orm` |
| Auth | `auth.provider` |
| Session | `auth.sessionMechanism` |
| UI Framework | `ui.framework` |
| Design System | `ui.designSystem` |
| Hosting | `hosting.platform` |
| CI/CD | `hosting.cicd` |
| Unit Tests | `testing.unitFramework` |
| E2E Tests | `testing.e2eFramework` |
| Component Tests | `testing.componentFramework` |

## Development Process: Spec-Driven Development

Every feature, bug fix, or change follows this lifecycle:

1. **Spec First** — No code without an approved spec in `specs/`
2. **Human Approval** — Specs require explicit approval before implementation begins
3. **Implementation** — Code against approved acceptance criteria only
4. **Test** — Automated tests must pass per `test.yml` in the spec
5. **Review** — Security + performance review before merge
6. **Mark Complete** — Update spec status to `completed`

### GitHub Issue Sync

Every spec status transition MUST update the linked GitHub issue. Agents and prompts are responsible for syncing bidirectionally:

- **Spec → GitHub**: When spec status changes, update issue labels, assignee, and add a status comment
- **GitHub → Spec**: When a GitHub issue is created/updated, the `github-sync` agent creates or updates the matching spec

GitHub Projects board: **Backlog → Ready → In progress → In review → Done**

| Spec Status | GitHub Label | Board Column | Action |
|-------------|-------------|-------------|--------|
| `draft` | `spec-draft` | Backlog | Comment with spec link |
| `review` | `spec-review` | Backlog | Assign to human reviewer |
| `approved` | `spec-approved` | Ready | Ready for coder pickup |
| `in-progress` | `in-progress` | In progress | Assign to coder |
| `implemented` | `needs-review` | In review | Assign to QA |
| `verified` | `verified` | In review | Assign to reviewer |
| `completed` | *(close issue)* | Done | Ship it |
| `disabled` | `disabled` | *(closed)* | Close as not-planned |

See `skills/spec-management/references/lifecycle.md` for full transition rules and label map.

See `specs/README.md` for the full spec structure and workflow.

## Architecture Patterns

Read from `project-config.json` → `architecture.patterns` (array of strings).

Apply these patterns when writing code. If the array is empty, use sensible defaults for the configured tech stack.

## Coding Standards

Read from `project-config.json` → `architecture.codingStandards` (array of strings).

Apply the language from `techStack.language` and import alias from `conventions.importAlias`.

## File Organization

Read from `project-config.json` → `fileStructure` (multiline string) and `conventions.*`.

Use `conventions.sourceDirectory` as the root source folder. Use `conventions.importAlias` for import paths. Only process files with extensions from `conventions.fileExtensions`.

## Security Rules

Read from `project-config.json` → `architecture.securityRules` (array of strings).

Apply security rules specific to `auth.provider` and `database.primary`. If the array is empty, enforce OWASP Top 10 defaults.

## Performance Rules

Read from `project-config.json` → `architecture.performanceTargets` (array of strings).

Apply performance targets specific to `techStack.frontend` and `hosting.platform`. If the array is empty, use defaults (Lighthouse ≥ 90, FCP < 1.5s, TTI < 3.5s).

## Branching & PR Conventions

All work happens on a feature/fix branch off `dev`, lands via squash-merge PR, and is deployed by `/orch-merge-deploy`.

| Workflow | Branch prefix | Owning prompt |
|----------|--------------|---------------|
| Story (spec → ship) | `story/{issue-number}-{slug}` | `/orch-refine-story` → `/orch-deliver-story` → `/orch-merge-deploy` |
| Bug fix | `fix/{issue-or-slug}` | `/orch-fix-bug` → `/orch-merge-deploy` |
| Automation test fix | `fix-tests/{slug}` | `/fix-automation-test` → `/orch-merge-deploy` |

Rules:
- **Base branch is always `dev`** — never branch off `main` / `master`.
- **Squash-merge only** — keep `dev` history linear.
- **Commit / PR prefix** mirrors conventional commits: `feat({area}): …`, `fix({area}): …`, `test({area}): …`, `spec({area}): …`, `docs(kb): …`.
- **PR body** must link the GitHub issue (`Fixes #N` / `Refs #N`), summarize ACs covered, and link any new `knowledge-base/` entries.
- **Never force-push** to `dev`. Force-push is allowed only on your own feature/fix branch before review.
- **Production promotion** (`dev → main`) is out of scope for this kit — wire your own promotion pipeline if you need it.

## Knowledge Base (read-first / write-after)

Agents MUST consult `knowledge-base/` before non-trivial work and contribute back after.

| Folder | Read before… | Written by |
|--------|--------------|------------|
| `knowledge-base/repo-knowledge/` | Implementing, reviewing, or onboarding | `@knowledge-base` |
| `knowledge-base/fix-history/` | Debugging or fixing a bug | `@bug-fixer` |
| `knowledge-base/automation-test-fixes/` | Touching a failing or flaky test | `@test-fixer` |

Rules:
- **Search first.** Grep the relevant subfolder by keyword, file path, error message, or `tags:` frontmatter before proposing a fix or design.
- **Write after.** When a fix or insight meets the "when to add an entry" criteria in `knowledge-base/README.md`, the owning agent appends a new file using the matching `TEMPLATE.md`.
- **Be honest.** Workarounds, quarantined tests, and reverts are recorded with `fix_type: workaround` (or equivalent) so the debt stays visible.
- **Cross-link.** Entries should link to related specs, GitHub issues, and other knowledge-base entries.

## Mock Auth & Multi-Role Testing

Enable mock authentication for local development and testing by setting environment variables:

```env
MOCK_AUTH_ENABLED=true          # Activates mock auth (MUST also be non-production)
MOCK_AUTH_DEFAULT_USER=user-01  # Auto-login user for dev server
MOCK_AUTH_BYPASS_MFA=true       # Skip MFA in tests
```

### Safety Rules

- Mock auth activates ONLY when `MOCK_AUTH_ENABLED=true` AND `NODE_ENV !== 'production'`
- Production builds must tree-shake/exclude mock auth modules
- Mock data uses `@mock.test` domain and `mock_` token prefixes
- Mock auth helpers live in `__tests__/helpers/` — never in production source

### Available Mock Users

50 users across 10 roles (super-admin, admin, billing-admin, owner, manager, moderator, editor, viewer, support, guest) and 6 OAuth providers (Google, GitHub, Phone, Apple, Microsoft, Facebook). See `skills/testing/references/mock-users.md` for the full registry.

### Test Coverage Requirements

- Every protected route tested with: allowed role, denied role, unauthenticated, edge case
- Critical flows tested with 2+ OAuth providers
- Edge cases: expired session, banned user, unverified email, MFA enforcement
