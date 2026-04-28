---
description: "Orchestrated: Auto-fetch the top backlog story from GitHub, create branch, generate spec, get human approval, and move to Ready — optimized for solo developer"
tools: [read, search, edit, execute, todo, github/*]
agents: [github-sync, planner]
argument-hint: "Optional: GitHub issue number to target a specific story (e.g., '#42'). Omit to auto-pick the top backlog story."
---

End-to-end story refinement — from Backlog to Ready (approved spec), with human checkpoints. Optimized for solo developers: automatically picks the highest-priority backlog story so you don't have to choose.

## Orchestration Flow

```
[1. Auto-Pick Top Story] → 🧑 HIL (confirm or swap) → [2. Create Branch + Spec] → [3. Post Questions] → 🧑 HIL → [4. Approve & Move to Ready]
```

**This prompt's output feeds into `orch-deliver-story` which picks up approved specs.**

## Instructions

### Phase 1 — Auto-Pick Top Priority Story

> **First**: Read `project-config.json` → `github.repository` to get the current repo (e.g., `acme/mobile-app`). All issue filtering is scoped to this repo.

1. If an argument was provided (e.g., `#42`), fetch that specific GitHub issue:
   - **Validate repo link**: Check the issue's repository matches `github.repository` AND it carries the `github.repositoryLabel` label (if configured)
   - If validation fails → **STOP**:
     ```
     ⛔ Issue #{number} is not linked to this repository ({github.repository}).
     This board is shared across multiple apps. Please use the repo this issue belongs to,
     or add the repository label to link it first.
     ```
   - If valid → use this issue, skip priority sorting
2. If no argument, fetch the **top priority story** automatically:
   - Query GitHub Projects **Backlog** column filtered to `github.repository` (and `github.repositoryLabel` if set)
   - Exclude issues already labeled `spec-approved`, `in-progress`, or `spec-review`
   - Order by priority:
     1. Issues with a milestone — earliest due date wins
     2. Then oldest open issue by number (ascending)
   - Select the **first result** — do not present a list
   - If no matching issues found → **STOP**: "No backlog stories found for `{github.repository}`. Add issues to the Backlog column and link them to this repo."
3. Parse the issue **title prefix** to determine issue type:
   | Prefix | Type | Action |
   |--------|------|--------|
   | `[Feature]` | Full feature | Create new 4-file spec package |
   | `[User Story]` | Single user story | Add US to existing spec or create focused spec |
   | `[AC]` | Acceptance criteria | Update specific AC in existing spec |
   | *(none)* | Auto-detect | Classify by issue content |
4. Fetch the full issue (title, body, labels, milestone, assignee)
5. Display a brief card:
   ```
   ## Top Backlog Story
   - **Issue**: #{number} — {title (without prefix)}
   - **Type**: [Feature] / [User Story] / [AC] / auto-detected
   - **Repository**: {github.repository}
   - **Milestone**: {milestone or 'none'}
   - **Labels**: {labels}
   - **Spec exists**: ✅ / ❌
   - **Summary**: {first 2 sentences of issue body}
   ```

### 🧑 Human Gate 1 — Confirm Story (quick check)

> **Ask the user ONE question:**
> "Proceeding with issue #{number} — {title} ({type}). Continue, or provide a different issue number?"
>
> - **No response / 'yes' / 'go'** → proceed immediately
> - **Issue number provided** → fetch that issue, run repo validation, then proceed
> - **'abort'** → stop

This gate is intentionally lightweight — as a solo developer you just need a quick sanity check, not a full selection menu. If the story already has a spec in `review` status, note it and skip to Phase 3.

---

### Phase 2 — Create Branch & Generate Spec

4. Determine the branch name from the issue:
   - Format: `story/{issue-number}-{short-slug}` (e.g., `story/42-user-watchlist`)
   - Slug: lowercase, hyphens, max 30 chars from the issue title
5. Create the feature branch from dev:
   ```bash
   git checkout dev && git pull origin dev
   git checkout -b story/{issue-number}-{short-slug}
   ```
6. Read the full GitHub issue body — extract:
   - Requirements and user flows
   - Acceptance criteria (if any listed in the issue)
   - Design references or mockups (links)
   - Edge cases or constraints mentioned
7. Hand off to **Planner Agent** to create the spec package:
   - Create `specs/{feature-name}/` with all 4 files: `spec.md`, `styles.md`, `schema.yml`, `test.yml`
   - Map issue requirements to numbered user stories (US-1, US-2, ...) and acceptance criteria (AC-N.M)
   - Add `github_issue: {issue-number}` to spec.md frontmatter
   - Set `status: draft`
8. **Sync GitHub**: Update the issue:
   - Add label `spec-draft`
   - Comment: "Spec created from issue. Branch: `story/{issue-number}-{slug}`"
9. Review the generated spec for completeness:
   - Are all requirements from the issue covered?
   - Are ACs specific and testable?
   - Are there ambiguities that need human input?

---

### Phase 3 — Post Questions & Review Request

10. Identify open questions or ambiguities in the spec:
    - Missing edge case definitions
    - Unclear business rules
    - UI/UX decisions that need product input
    - Data model questions
    - Dependencies on other features
11. If questions exist, post them as a comment on the GitHub issue:
    ```
    **Spec Review — Questions Before Approval**
    
    The spec has been drafted. Please review and answer these questions:
    
    1. {question about unclear requirement}
    2. {question about edge case}
    3. {question about design decision}
    
    **Spec files**: `specs/{feature-name}/`
    **Branch**: `story/{issue-number}-{slug}`
    
    Once questions are resolved, approve the spec to move this story to Ready.
    ```
12. Update spec status to `review`
13. **Sync GitHub**: Update issue (label → `spec-review`, remove `spec-draft`)
14. Present the spec summary and questions to the user in chat:
    ```
    ## Spec Summary
    - **Feature**: {name}
    - **User Stories**: {count}
    - **Acceptance Criteria**: {total ACs}
    - **Branch**: story/{issue-number}-{slug}
    - **GitHub Issue**: #{number}
    
    ## Open Questions
    1. {question}
    2. {question}
    
    ## Spec Preview
    {Show user stories and ACs from spec.md}
    ```

### 🧑 Human Gate 2 — Approve, Request Changes, or Answer Questions

> **Pause and ask the user:**
> - "Review the spec above. What would you like to do?"
> - **Approve** — spec is good, move to Ready
> - **Request changes** — provide feedback, loop back to Phase 2 to update the spec
> - **Answer questions** — provide answers, agent updates the spec accordingly and re-presents
> - **Abort** — stop refinement, keep spec in `review` status

**Do NOT proceed past this gate without explicit user approval.**

**If user provides answers or requests changes:**
- Update the spec files with the answers/feedback
- Re-post updated spec summary to the user
- **Loop back to this gate** until user says "Approve"

---

### Phase 4 — Approve Spec & Move to Ready

15. Update spec status to `approved` in `spec.md`
16. Commit the spec files to the branch:
    ```bash
    git add specs/{feature-name}/
    git commit -m "spec({feature-name}): approved spec for #{issue-number}"
    git push origin story/{issue-number}-{slug}
    ```
17. **Sync GitHub**: Update the issue:
    - Label → `spec-approved`, remove `spec-review`
    - Move issue card to **Ready** column on Projects board
    - Comment:
      ```
      **Status → approved**
      Spec approved and committed to branch `story/{issue-number}-{slug}`.
      Ready for implementation — pick up with `orch-deliver-story`.
      ```
18. Present final summary:
    ```
    ## Story Ready ✅
    - **Spec**: {name} (status: approved)
    - **Branch**: story/{issue-number}-{slug}
    - **GitHub Issue**: #{number} → Ready column
    - **User Stories**: {count}
    - **Acceptance Criteria**: {total}
    
    ➡️ Next: Run `orch-deliver-story` to implement, test, and review this story.
    ```

## Error Recovery

- If GitHub issue fetch fails: ask user to paste the issue content directly
- If branch already exists: check it out and continue from where it left off
- If spec folder already exists: read existing spec, offer to update vs. recreate
- If Planner Agent returns incomplete spec: fill gaps with `[TBD]` markers and flag in questions
- At any point the user can say "abort" to stop the orchestration

## Constraints

- ALWAYS pause at both human gates — never auto-approve a spec
- ALWAYS post questions on the GitHub issue so stakeholders can see them
- ALWAYS create the branch before writing spec files
- NEVER set spec to `approved` without explicit human approval
- NEVER modify existing specs from other features
- NEVER implement code — this prompt only produces specs (implementation is `orch-deliver-story`)
- Track every phase in the todo list so the user sees progress
