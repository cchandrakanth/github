---
description: "Interactive project setup — configure tech stack, database, auth, and customize all framework files"
agent: "onboard"
argument-hint: "Say 'start' or describe your project briefly"
---

Set up the development framework for this project.

## Instructions

1. Read `project-config.json` to see which fields are already filled
2. Ask the developer about their project using the onboard agent's question sequence (skip pre-filled fields)
3. Write all answers into `project-config.json` — including the `github` section (`repository`, `projectNumber`, `repositoryLabel`)
4. Verify `knowledge-base/` exists with the three subfolders + READMEs + TEMPLATEs (do not pre-fill entries)
5. Verify `hooks/scripts/post-edit-check.sh` is executable
6. Remind the user to copy `setup/mcp.json` to `.vscode/mcp.json` and provide a GitHub PAT (`repo`, `project`, `read:org`)
7. Print a summary of the config and next steps

Start by reading `project-config.json`, then ask: "Let's set up your project. What's the project name and what does it do?"
