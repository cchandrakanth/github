# Project Instructions

> **All project-specific values are defined in `project-config.json` at the repo root.**
> Agents, instructions, and prompts MUST read `project-config.json` to resolve technology choices, conventions, and project metadata. Do not hardcode technology-specific values — always derive them from the config.

> **Root-level artifacts:** `project-config.json` and `knowledge-base/` live at the **project root** — never inside `.github/` or `.claude/`. Do not move them back, and always reference them by root-relative path.

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

> **Non-negotiable: SPEC FIRST, ALWAYS.** No code, schema, migration, test, or config change is written without an approved spec in `specs/`. If a request arrives without one, create the spec first (via the `orch-refine-story` or `define-spec` prompt, or the `planner` agent), get human approval, and only then implement. The only exceptions are documentation-only edits and `knowledge-base/` entries.

Every feature, bug fix, or change follows this lifecycle:

1. **Spec First** — No code without an approved spec in `specs/`
2. **Human Approval** — Specs require explicit approval before implementation begins
3. **Implementation** — Code against approved acceptance criteria only; check each AC box (`- [ ]` → `- [x]`) as its code is implemented
4. **Test** — Automated tests must pass per `test.yml` in the spec
5. **Review** — Security + performance review before merge
6. **Mark Complete** — Update spec status to `completed`

### AC Checkbox Policy (guard)

AC checkboxes in `spec.md` track **implementation**, not test results:

- The **Coder** flips `- [ ]` → `- [x]` for each AC **as soon as the code implementing it is written** — never wait for automation tests to pass.
- A spec may move to `implemented` only when **every** AC checkbox is `[x]`.
- **Automation tests never gate a checkbox.** Test outcomes are recorded in the test report and expressed through the spec `status` transition `implemented` → `verified`.
- QA, test, and review agents MUST NOT modify AC checkboxes. If a test fails for a checked AC, the checkbox stays checked (the code exists — the failure is a defect routed back to the Coder); if an AC is unchecked on an `implemented` spec, flag it to the Coder instead of checking it.
- The `spec-guard` hook (`.github/hooks/scripts/spec-guard.sh`) warns whenever a spec's `status` and its AC checkboxes disagree.

### Templates Are Mandatory

Every generated artifact MUST be created from its defined template — never invent an ad-hoc structure or skip template sections:

| Artifact | Template |
|----------|----------|
| Spec — `specs/{feature}/spec.md` | `.github/skills/spec-management/assets/spec.template.md` |
| Schema — `specs/{feature}/schema.yml` | `.github/skills/spec-management/assets/schema.template.yml` |
| Test plan — `specs/{feature}/test.yml` | `.github/skills/spec-management/assets/test.template.yml` |
| Styles — `specs/{feature}/styles.md` | `.github/skills/spec-management/assets/styles.template.md` |
| Repo knowledge entry | `knowledge-base/repo-knowledge/TEMPLATE.md` |
| Bug fix record | `knowledge-base/fix-history/TEMPLATE.md` |
| Test fix record | `knowledge-base/automation-test-fixes/TEMPLATE.md` |

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

### Comment Rules

- **Inline comments only** — use end-of-line `// …` (or language-equivalent) comments; do not add block comments, JSDoc, or docstrings unless explicitly asked.
- **Minimal comments** — only comment non-obvious logic. Do not comment self-explanatory code, variable names, or standard patterns.

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

## Firebase Skills

Firebase skills are installed in `.agents/skills/`. All agents MUST load the relevant skill via `read_file` on `.agents/skills/{skill-name}/SKILL.md` **before** working on Firebase-related tasks.

| Scenario | Skill to load |
|----------|--------------|
| Firebase CLI, project init, `firebase.json`, `.firebaserc` | `firebase-basics` |
| Firebase Auth — sign-in, custom claims, JWT, RBAC | `firebase-auth-basics` |
| Firestore — data modeling, queries, indexes, client SDK | `firebase-firestore` |
| Firestore security rules — writing or auditing | `firebase-security-rules-auditor` |
| Firebase SQL Connect / Data Connect — schemas, GQL mutations, type-safe SDK | `firebase-data-connect` |
| Firebase App Hosting — Next.js/Angular deployment with backend | `firebase-app-hosting-basics` |
| Firebase Hosting (classic) — static sites, SPAs | `firebase-hosting-basics` |
| Remote Config — feature flags, dynamic config | `firebase-remote-config-basics` |
| Firebase AI Logic — Gemini API, multimodal inference | `firebase-ai-logic-basics` |
| Crashlytics — crash reporting, SDK setup | `firebase-crashlytics` |
| Genkit (TypeScript/Node.js) — AI agents, flows, tools | `developing-genkit-js` |

> **Boundary rule** (from `architecture.patterns`): Firebase Admin SDK on server only; Firebase client SDK on client only — never cross the boundary. PostgreSQL via SQL Connect is the source of truth; Firestore stores denormalized read projections only.

## Knowledge Base (read-first / write-after)

`knowledge-base/` lives at the **project root** (not inside `.github/`). Agents MUST consult it before non-trivial work and contribute back after.

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
