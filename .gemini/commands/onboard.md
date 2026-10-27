---
description: "Interactive project setup — configure tech stack, database, auth, and customize all framework files"
argument-hint: "Say 'start' or describe your project briefly"
---

> Run with the **onboard** subagent (`.gemini/agents/onboard.md`). Arguments: `$ARGUMENTS`

Set up the development framework for this project.

## Instructions

1. Read `project-config.json` to see which fields are already filled
2. Ask the developer about their project using the onboard agent's question sequence (skip pre-filled fields)
3. Write all answers into `project-config.json` — including `conventions.packageManager` and the `github` section (`repository`, `projectNumber`, `repositoryLabel`)
4. Scaffold the folder structure — `specs/README.md` from `.gemini/skills/spec-management/assets/specs-readme.template.md`, `__tests__/helpers/`, and the source tree from `fileStructure` rooted at `conventions.sourceDirectory`; create only what is missing, never overwrite
5. Install dependencies derived from the config (framework, language toolchain, ORM/DB driver, auth SDK, UI kit, unit/e2e/component test frameworks, lint + format) using `conventions.packageManager` — show the exact command and get approval before running it
6. Generate baseline tooling config that doesn't exist yet: `tsconfig.json` paths for `conventions.importAlias`, `.env.example` (including the mock-auth vars), `.gitignore`, unit/e2e test configs, `package.json` scripts, and a CI workflow when `hosting.cicd` is GitHub Actions
7. Verify `knowledge-base/` exists at the **project root** with the three subfolders + READMEs + TEMPLATEs (do not pre-fill entries)
8. Remind the user to copy `.gemini/mcp_config.json.example` to `~/.gemini/config/mcp_config.json` (or `.gemini/.mcp.json.example` to `.mcp.json`) and provide a GitHub PAT (`repo`, `project`, `read:org`)
9. Run the lint and unit-test scripts plus `.gemini/scripts/validate-config.sh` once to verify the scaffold, then print a summary: config values, paths created, packages installed (and any that failed), check results, and next steps

Start by reading `project-config.json`, then ask: "Let's set up your project. What's the project name and what does it do?"
