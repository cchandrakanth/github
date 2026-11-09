# Claude Code Starter Kit

A reusable, tech-stack-agnostic framework for **spec-driven development** with Claude Code agents.

## Quick Start

1. **Install into your target project** using the installer script (or copy manually):
   ```bash
   ./.claude/scripts/install.sh <your-project>
   ```
   Or copy manually:
   ```bash
   cp -r .claude/ <your-project>/.claude/
   cp CLAUDE.md <your-project>/CLAUDE.md
   mkdir -p <your-project>/specs
   cp .claude/skills/spec-management/assets/specs-readme.template.md <your-project>/specs/README.md
   cp project-config.json <your-project>/project-config.json     # config lives at the project root, NOT inside .claude/
   cp -r knowledge-base/ <your-project>/knowledge-base/          # knowledge-base lives at the project root, NOT inside .claude/
   ```

2. **Set up GitHub MCP tools** — copy `.claude/.mcp.json.example` to `.mcp.json` at the target project root:
   ```bash
   cp .claude/.mcp.json.example .mcp.json
   ```
   Provide a [GitHub Personal Access Token](https://github.com/settings/tokens) with **repo**, **project**, and **read:org** scopes via `GITHUB_PERSONAL_ACCESS_TOKEN`.

3. **Edit `project-config.json`** at the repo root directly, or run the onboard wizard interactively in Claude Code:
   ```
   /onboard
   ```

## What's Included

| Folder / File | Contents | Purpose |
|---------------|----------|---------|
| `../CLAUDE.md` | Always-on project rule at the **repo root** | Auto-loaded by Claude Code; enforces spec-first rules & conventions |
| `../project-config.json` | Single config file at the **repo root** | All project technology & convention settings |
| `agents/` | 14 agent definitions | Role-based development agents (`.claude/agents/*.md`) |
| `commands/` | 14 workflow commands | Common development workflows (8 task commands + 6 stateful orchestrators) |
| `instructions/` | 7 instruction files | Path-scoped coding standards (`.claude/instructions/*.instructions.md`) |
| `skills/` | 11 skill packages | Deep domain knowledge (`spec-management`, `relational-db`, `testing`, `security-review`, `performance`, `firebase`, `playwright-cli`, `mongodb`, `aws`, `azure`, `gcp`) |
| `scripts/` | Installer & validator | `install.sh`, `validate-config.sh`, `move-to-ready.mjs` |
| `.mcp.json.example` | MCP config template | GitHub MCP server configuration |

> **Note:** `project-config.json` and `knowledge-base/` live at the **project root** (never inside `.claude/`).

