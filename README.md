# GitHub Copilot Starter Kit

A reusable, tech-stack-agnostic framework for **spec-driven development** with GitHub Copilot agents.

## Quick Start

1. **Copy** this folder into your new project:
   ```bash
   cp -r github/ <your-project>/.github/
   cp -r github/specs-starter/ <your-project>/specs/
   ```

2. **Set up GitHub MCP tools** — copy the MCP config so agents can read/write GitHub Issues and Projects:
   ```bash
   mkdir -p <your-project>/.vscode
   cp github/setup/mcp.json <your-project>/.vscode/mcp.json
   ```
   Then create a [GitHub Personal Access Token](https://github.com/settings/tokens) with **repo**, **project**, and **read:org** scopes. VS Code will prompt you for the token when an agent first uses a GitHub tool.

3. **Edit `project-config.json`** at the repo root directly, or run the onboard agent to fill it interactively:
   ```
   @onboard
   ```
   Be sure to fill the `github` section:
   ```json
   "github": {
     "repository": "owner/repo-name",
     "projectNumber": "1",
     "repositoryLabel": "my-app"
   }
   ```

4. The config (or onboard agent) covers:
   - Project purpose and organization intent
   - Tech stack (frontend, backend, mobile, serverless)
   - Database (Firestore, PostgreSQL, MongoDB, etc.)
   - Authentication method
   - UI framework and styling
   - Hosting/deployment target
   - Testing preferences
   - Architecture patterns, coding standards, security rules, performance targets

5. All agents, instructions, and prompts **read from `project-config.json`** at runtime — no placeholder tokens to search and replace.

## Reading Stories from GitHub

Agents use the **GitHub MCP server** (configured in `.vscode/mcp.json`) to interact with GitHub Issues and Projects. Here's how stories flow:

### How agents read stories

| Action | Agent / Prompt | What Happens |
|--------|---------------|-------------|
| **Auto-pick top backlog story** | `/orch-refine-story` | Reads the GitHub Projects board "Backlog" column, picks highest-priority issue scoped to `github.repository` |
| **Pick a specific issue** | `/orch-refine-story #42` | Fetches issue #42 directly via MCP tools |
| **List ready stories** | `/orch-deliver-story` | Reads the Projects board "Ready" column for approved stories |
| **Triage & prioritize** | `@product-owner` | Reads all issues on the board filtered by `github.repositoryLabel` |
| **Sync issues ↔ specs** | `@github-sync` | Bidirectional: reads issues to create specs, updates issues when spec status changes |
| **Check project status** | `/project-status` | Reads specs locally and compares with GitHub issue labels |
| **Fix a bug end-to-end** | `/orch-fix-bug` | KB-search → diagnose → fix → spec update → regression test → record + consolidate → PR |
| **Stabilize a flaky test** | `/fix-automation-test` | Reads `automation-test-fixes/`, thinks beyond, fixes, records, opens PR |

### Manual story lookup

Ask any GitHub-connected agent directly:
```
@github-sync Read issue #42 and create a spec for it
@product-owner Show me all backlog items for this repo
```

### Prerequisites

1. `.vscode/mcp.json` exists with the GitHub MCP server configured (see Quick Start step 2)
2. `project-config.json` → `github.repository` is set to your `owner/repo-name`
3. `project-config.json` → `github.projectNumber` points to your GitHub Projects board
4. GitHub PAT has **repo**, **project**, and **read:org** scopes

## What's Included

| Folder | Contents | Purpose |
|--------|----------|---------|
| `project-config.json` | Single config file | All project technology & convention settings |
| `agents/` | 13 agent definitions | Role-based development agents |
| `instructions/` | 5 instruction files | File-specific coding standards |
| `prompts/` | 14 prompt templates | Common development workflows (10 task prompts + 4 orchestrators) |
| `skills/` | 4 skill packages | Deep domain knowledge |
| `knowledge-base/` | Repo knowledge, fix history, test-fix log | Persistent memory for agents — read first, write after |
| `hooks/` | Post-edit security hook | Automated guardrails |
| `setup/` | `mcp.json` template | GitHub MCP server config — copy to `.vscode/` |
| `specs-starter/` | Spec framework + templates | Copy to project root as `specs/` |

## Agents

| Agent | Role | When to Use |
|-------|------|-------------|
| `@onboard` | Project setup wizard | First-time setup, tech stack config |
| `@product-owner` | Product decisions | Roadmap, priorities, spec approval |
| `@planner` | Architecture & specs | Create specs, break down requirements |
| `@coder` | Implementation | Build features from approved specs |
| `@reviewer` | Code review | Quality gates, spec compliance |
| `@security` | Security audit | OWASP checks, vulnerability scan |
| `@performance` | Performance audit | Bundle, render, data efficiency |
| `@qa-engineer` | Test automation | Write and run tests from specs |
| `@cleanup` | Codebase hygiene | Dead code, unused deps |
| `@github-sync` | GitHub integration | Issues ↔ specs sync |
| `@knowledge-base` | Repo knowledge curator | Capture & query architecture / convention notes |
| `@bug-fixer` | Bug diagnosis & fix log | Search prior fixes, record new ones in `knowledge-base/fix-history/` |
| `@test-fixer` | Automation test stabilizer | Search & record fixes for flaky/failing tests |

## Prompts

| Prompt | What It Does |
|--------|-------------|
| `/onboard` | Interactive project setup wizard |
| `/new-spec` | Create a new feature spec (4 files) |
| `/update-spec` | Add user stories or modify ACs in existing spec |
| `/implement-spec` | Implement an approved spec (full) |
| `/implement-story` | Implement a specific user story or AC from a spec |
| `/review-spec` | Review implementation vs spec |
| `/test-spec` | Run tests for a feature |
| `/security-audit` | Security scan on file/feature/project |
| `/project-status` | Dashboard of all specs and progress |
| `/fix-automation-test` | Fix a failing/flaky test: read fix history, think beyond, stabilize, record, PR |
| **Orchestrators** | |
| `/orch-refine-story` | End-to-end: Backlog → approved spec. Fetches a GitHub issue, creates a branch, generates the full spec package via Planner, posts open questions, and gates on human approval before moving to Ready |
| `/orch-deliver-story` | End-to-end: Ready → verified. Picks an approved story, implements via Coder, runs tests via QA Engineer, runs review via Reviewer — with human gates after test results and before marking verified |
| `/orch-fix-bug` | End-to-end bug fix: branch → KB-search → diagnose → fix → update spec → regression test → record + consolidate KB → PR |
| `/orch-merge-deploy` | End-to-end: Verified → Done. Runs pre-flight checks, creates a PR, squash-merges to dev, triggers deployment, and closes the GitHub issue — with human gates before merge and before deploy |

## Customization

### `project-config.json`

The single source of truth for all project settings. Every agent, instruction, and prompt reads from this file.

| Config Section | Keys | Purpose |
|---------------|------|---------|
| `project` | `name`, `description` | Project identity and org intent |
| `techStack` | `language`, `frontend`, `mobile`, `backend`, `serverless` | Core technology choices |
| `database` | `primary`, `orm`, `dataPattern`, `caching` | Data layer configuration |
| `auth` | `provider`, `sessionMechanism` | Authentication setup |
| `ui` | `framework`, `responsiveTarget`, `designSystem` | UI/styling choices |
| `hosting` | `platform`, `cicd`, `monorepo` | Deployment configuration |
| `testing` | `unitFramework`, `e2eFramework`, `componentFramework` | Test tooling |
| `conventions` | `importAlias`, `sourceDirectory`, `fileExtensions` | Code conventions |
| `architecture` | `patterns`, `codingStandards`, `securityRules`, `performanceTargets` | Rules (arrays of strings) |
| `knowledgeBase` | `enabled`, `rootPath`, `paths`, `rules` | Knowledge-base location and read-first / write-after rules |
| `fileStructure` | *(string)* | Project directory tree |

### Setup Options

**Option A: Interactive** — Run `@onboard` and answer questions. It fills `project-config.json` for you.

**Option B: Manual** — Edit `project-config.json` directly with your values. All agents will pick up the changes automatically.

## Spec-Driven Development

Every feature follows: **Spec → Approve → Build → Test → Review → Ship**

```
draft → review → approved → in-progress → implemented → verified → completed
```

Human gates at: `review → approved` and `verified → completed`

See `specs-starter/README.md` for the full workflow.

## Knowledge Base

`knowledge-base/` is the project's persistent memory. Agents **read it first** before non-trivial work and **write to it after** producing a reusable insight or fix.

| Folder | Purpose | Owning Agent |
|--------|---------|--------------|
| `knowledge-base/repo-knowledge/` | Architecture notes, conventions, gotchas, ADRs, glossary | `@knowledge-base` |
| `knowledge-base/fix-history/` | One file per non-trivial bug fix (root cause, fix, prevention) | `@bug-fixer` |
| `knowledge-base/automation-test-fixes/` | One file per non-trivial test fix (flake pattern, root cause, prevention) | `@test-fixer` |

Each subfolder ships with a `README.md` and a `TEMPLATE.md`. See `knowledge-base/README.md` for naming conventions and "when to add an entry" rules.

## End-to-End Workflows

Stitch orchestrators together for the full lifecycle:

```
            ┌──────────────────────┐
Backlog ──▶ │ /orch-refine-story   │ ──▶ Ready (approved spec)
            └──────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
Ready   ──▶ │ /orch-deliver-story  │ ──▶ verified
            └──────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
Verified ─▶ │ /orch-merge-deploy   │ ──▶ Done (merged + deployed)
            └──────────────────────┘

Bug reported  ──▶ /orch-fix-bug          ──▶ Fix branch + PR (then /orch-merge-deploy)
Test failing  ──▶ /fix-automation-test   ──▶ Test-fix branch + PR (then /orch-merge-deploy)
```

## Branching & PR Conventions

| Workflow | Branch prefix | Example |
|----------|--------------|---------|
| Story refinement / delivery | `story/{issue}-{slug}` | `story/42-user-watchlist` |
| Bug fix | `fix/{issue-or-slug}` | `fix/142-login-loop` |
| Test stabilization | `fix-tests/{slug}` | `fix-tests/login-redirect-flake` |

PRs target `dev`, are squash-merged, and are deployed via `/orch-merge-deploy`. Production promotion is **not** in scope of this kit — wire your own `dev → main` promotion if needed.
