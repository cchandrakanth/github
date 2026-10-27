# Google Antigravity / Gemini Starter Kit

A reusable, tech-stack-agnostic framework for **spec-driven development** with Google Antigravity and Gemini agents.

## Quick Start

1. **Install into your target project** using the installer script (or copy manually):
   ```bash
   ./.gemini/scripts/install.sh <your-project>
   ```
   Or copy manually:
   ```bash
   cp -r .gemini/ <your-project>/.gemini/
   cp GEMINI.md <your-project>/GEMINI.md
   mkdir -p <your-project>/specs
   cp .gemini/skills/spec-management/assets/specs-readme.template.md <your-project>/specs/README.md
   cp project-config.json <your-project>/project-config.json     # config lives at the project root, NOT inside .gemini/
   cp -r knowledge-base/ <your-project>/knowledge-base/          # knowledge-base lives at the project root, NOT inside .gemini/
   ```

2. **Set up GitHub MCP tools** — add the GitHub MCP server from `.gemini/mcp_config.json.example` to your Antigravity MCP config (`~/.gemini/config/mcp_config.json`) or project `.mcp.json`:
   ```bash
   mkdir -p ~/.gemini/config
   cp .gemini/mcp_config.json.example ~/.gemini/config/mcp_config.json
   ```
   Provide a [GitHub Personal Access Token](https://github.com/settings/tokens) with **repo**, **project**, and **read:org** scopes via `GITHUB_PERSONAL_ACCESS_TOKEN`.

3. **Edit `project-config.json`** at the repo root directly, or run the onboard wizard interactively in Antigravity:
   ```
   /onboard
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

5. `GEMINI.md` at the project root is **automatically discovered and loaded by Antigravity** on every turn. It enforces deterministic routing to `.gemini/commands/`, `.gemini/agents/`, `.gemini/instructions/`, and `.gemini/skills/`, reading all project-specific settings from `project-config.json` at runtime.

## Reading Stories from GitHub

Agents use the **GitHub MCP server** to interact with GitHub Issues and Projects. Here's how stories flow:

### How agents read stories

| Action | Command / Agent | What Happens |
|--------|-----------------|--------------|
| **Auto-pick top backlog story** | `/orch-refine-story` | Reads the GitHub Projects board "To Do" column, picks highest-priority issue scoped to `github.repository` |
| **Pick a specific issue** | `/orch-refine-story #42` | Fetches issue #42 directly via MCP tools |
| **List ready stories** | `/orch-deliver-story` | Reads the Projects board "Ready" column for approved stories |
| **Triage & prioritize** | `@product-owner` | Reads all issues on the board filtered by `github.repositoryLabel` |
| **Sync issues ↔ specs** | `@github-sync` | Bidirectional: reads issues to create specs, updates issues when spec status changes |
| **Check project status** | `/project-status` | Reads specs locally and compares with GitHub issue labels |
| **Fix a bug end-to-end** | `/orch-fix-bug` | KB-search → diagnose → fix → spec update → regression test → record + consolidate → PR |
| **Stabilize a flaky test** | `/fix-automation-test` | Reads `automation-test-fixes/`, thinks beyond, fixes, records, opens PR |

## What's Included

| Folder / File | Contents | Purpose |
|---------------|----------|---------|
| `../GEMINI.md` | Always-on project rule at the **repo root** | Auto-loaded by Antigravity; enforces spec-first rules & deterministic routing |
| `../project-config.json` | Single config file at the **repo root** | All project technology & convention settings |
| `agents/` | 14 agent definitions | Role-based development agents (`.gemini/agents/*.md`) |
| `commands/` | 14 workflow commands | Common development workflows (8 task commands + 6 stateful orchestrators) |
| `instructions/` | 7 instruction files | Path-scoped coding standards (`.gemini/instructions/*.instructions.md`) |
| `skills/` | 10 skill packages | Deep domain knowledge (`spec-management`, `testing`, `security-review`, `performance`, `firebase`, `playwright-cli`, `mongodb`, `aws`, `azure`, `gcp`) |
| `scripts/` | Installer & validator | `install.sh`, `validate-config.sh`, `move-to-ready.mjs` |
| `mcp_config.json.example` | MCP config template | GitHub MCP server configuration for Antigravity |
| `skills.json` | Skill discovery manifest | Optional manifest for registering nested skill directories |

> **Note:** `project-config.json` and `knowledge-base/` live at the **project root** (never inside `.gemini/`).

## Agents (`.gemini/agents/`)

| Agent | File | Role | When to Use |
|-------|------|------|-------------|
| `@onboard` | `.gemini/agents/onboard.md` | Project setup wizard | First-time setup, tech stack config & scaffolding |
| `@product-owner` | `.gemini/agents/product-owner.md` | Product decisions | Roadmap, priorities, spec approval |
| `@planner` | `.gemini/agents/planner.md` | Architecture & specs | Create specs, break down requirements |
| `@coder` | `.gemini/agents/coder.md` | Implementation | Build features from approved specs |
| `@reviewer` | `.gemini/agents/reviewer.md` | Code review | Quality gates, spec compliance |
| `@security` | `.gemini/agents/security.md` | Security audit | OWASP checks, vulnerability scan |
| `@performance` | `.gemini/agents/performance.md` | Performance audit | Bundle, render, data efficiency |
| `@qa-engineer` | `.gemini/agents/qa-engineer.md` | Test automation | Write and run tests from specs |
| `@cleanup` | `.gemini/agents/cleanup.md` | Codebase hygiene | Dead code, unused deps |
| `@github-sync` | `.gemini/agents/github-sync.md` | GitHub integration | Issues ↔ specs sync |
| `@knowledge-base` | `.gemini/agents/knowledge-base.md` | Repo knowledge curator | Capture & query architecture / convention notes |
| `@bug-fixer` | `.gemini/agents/bug-fixer.md` | Bug diagnosis & fix log | Search prior fixes, record new ones in `knowledge-base/fix-history/` |
| `@test-fixer` | `.gemini/agents/test-fixer.md` | Automation test stabilizer | Search & record fixes for flaky/failing tests |
| `@test-safety` | `.gemini/agents/test-safety.md` | Test-change guardrail | Validate risky test/infra changes before they land |

## Commands & Orchestrators (`.gemini/commands/`)

| Command | File | What It Does |
|---------|------|-------------|
| `/onboard` | `.gemini/commands/onboard.md` | Interactive project setup wizard |
| `/define-spec` | `.gemini/commands/define-spec.md` | Create a new feature spec (4 files) or update an existing one |
| `/implement-spec` | `.gemini/commands/implement-spec.md` | Implement an approved spec (full, single story, or single AC) |
| `/review-spec` | `.gemini/commands/review-spec.md` | Review implementation vs spec |
| `/test-spec` | `.gemini/commands/test-spec.md` | Run tests for a feature |
| `/security-audit` | `.gemini/commands/security-audit.md` | Security scan on file/feature/project |
| `/project-status` | `.gemini/commands/project-status.md` | Dashboard of all specs and progress |
| `/fix-automation-test` | `.gemini/commands/fix-automation-test.md` | Fix a failing/flaky test: read fix history, think beyond, stabilize, record, PR |
| **Orchestrators** | | |
| `/orch-refine-story` | `.gemini/commands/orch-refine-story.md` | To Do → Ready. Fetches a GitHub issue, creates a branch, generates the full spec package via Planner, and gates on human approval |
| `/orch-deliver-story` | `.gemini/commands/orch-deliver-story.md` | Ready → Developed. Picks an approved story, implements code + unit/component tests via Coder — with human approval gates |
| `/orch-merge-deploy` | `.gemini/commands/orch-merge-deploy.md` | Developed → Testing. Code review, PR, squash-merge feature branch to dev — with human gates before merge |
| `/orch-qe` | `.gemini/commands/orch-qe.md` | Testing → Ready To Deploy. Integrated test plan + Playwright tests on a test branch, UI test run, manual testing sign-off, merge to dev |
| `/orch-po` | `.gemini/commands/orch-po.md` | Ready To Deploy → Done. Bundles verified stories into a release branch, PRs to master, deploys to production |
| `/orch-fix-bug` | `.gemini/commands/orch-fix-bug.md` | End-to-end bug fix: branch → KB-search → diagnose → fix → update spec → regression test → record + consolidate KB → PR |

## End-to-End Workflows

Stitch orchestrators together for the full lifecycle:

```
              ┌──────────────────────┐
To Do    ──▶ │ /orch-refine-story   │ ──▶ Ready (approved spec)
              └──────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
Ready    ──▶ │ /orch-deliver-story  │ ──▶ Developed (code + unit tests)
              └──────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
Developed ─▶ │ /orch-merge-deploy   │ ──▶ Testing (merged to dev)
              └──────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
Testing  ──▶ │ /orch-qe             │ ──▶ Ready To Deploy (QE verified)
              └──────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
Ready To ──▶ │ /orch-po             │ ──▶ Done (released to production)
Deploy        └──────────────────────┘

Bug reported  ──▶ /orch-fix-bug          ──▶ Fix branch + PR (then /orch-merge-deploy)
Test failing  ──▶ /fix-automation-test   ──▶ Test-fix branch + PR (then /orch-merge-deploy)
```
