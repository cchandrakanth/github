# Full-Text Search

## Metadata

| Field | Value |
|-------|-------|
| **Status** | implemented |
| **Priority** | medium |
| **Created** | 2026-07-11 |
| **Updated** | 2026-07-11 |
| **Author** | planner (Claude) |
| **GitHub Issue** | [#4](https://github.com/cchandrakanth/github/issues/4) |

## Properties

```yaml
responsive: mobile-first
auth-required: false
api-routes: []
components: [src/app/(tabs)/search.tsx, src/components/SearchBar.tsx, src/components/SearchResultRow.tsx, src/db/repositories/searchRepo.ts]
```

## Summary

The Search tab finds notes as you type, matching against titles and body text using the SQLite FTS5 index defined in the foundation schema (`notes_fts`, kept in sync with `notes` via triggers). Results show highlighted snippets and open the note editor on tap. Search must stay fast (< 200ms for 10k notes) and never surface trashed notes.

## User Stories

### US-1: Search as you type

**As a** user
**I want** results to appear while I type
**So that** finding a note takes seconds

#### Acceptance Criteria

- [ ] **AC-1.1**: The Search tab focuses its input on open; results update as the user types (debounced ~250ms)
- [ ] **AC-1.2**: Matching is prefix-friendly (typing "groc" finds "Groceries") and case-insensitive, across title and body text
- [ ] **AC-1.3**: Results render < 200ms after the debounce with a 10,000-note database (FTS5 query, no table scan)
- [ ] **AC-1.4**: Trashed notes never appear in results; a note emptied from Trash disappears from the index immediately

### US-2: Understand and open results

**As a** user
**I want** to see why a note matched and jump straight into it
**So that** I can pick the right note at a glance

#### Acceptance Criteria

- [ ] **AC-2.1**: Each result shows the note title and a snippet around the match with the matched terms highlighted
- [ ] **AC-2.2**: Results are ordered by relevance (FTS5 bm25), with title matches ranking above body-only matches
- [ ] **AC-2.3**: Tapping a result opens that note in the editor; going back returns to the search with query and results intact
- [ ] **AC-2.4**: Result rows show the note's folder name (if any) as secondary metadata

### US-3: Search states

**As a** user
**I want** clear feedback when there's nothing to show
**So that** the screen never feels broken

#### Acceptance Criteria

- [ ] **AC-3.1**: Empty query shows a hint state (e.g. "Search your notes"), not stale results
- [ ] **AC-3.2**: A query with no matches shows a "No results for '<query>'" state
- [ ] **AC-3.3**: Clearing the query (X button) resets to the hint state and keeps keyboard focus

## Edge Cases

- **EC-1**: FTS5 operator characters in input (`"`, `*`, `-`, `AND`) are escaped/treated as literals — user input is never interpreted as query syntax and never crashes the query
- **EC-2**: Rapid typing then deleting back to empty — in-flight debounced queries are cancelled/ignored so stale results can't overwrite the hint state
- **EC-3**: Notes edited while search is open — re-running the same query reflects the new content (index synced on save)
- **EC-4**: Emoji and non-Latin scripts in notes are findable (unicode61 tokenizer)

## Out of Scope

- Filtering search by folder/tag (v2 — composes with `folders-tags` filters)
- Fuzzy/typo-tolerant matching, synonyms (v2)
- Search inside Trash (v2)

## Dependencies

- `specs/app-foundation` — `notes_fts` FTS5 table + sync triggers (see its schema.yml)
- `specs/notes-crud` — `body_text` projection maintained on every save (its AC-2.5)

## Questions

> Questions must be resolved before status can move from `draft` to `review`.

*(none — scope confirmed with the product owner on 2026-07-11)*

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-11 | Initial draft from onboarding decisions | planner (Claude) |
| 2026-07-11 | Approved by product owner; implemented (FTS5 + bm25 title boost, escaped queries, debounced screen; PERF-1 passes at 10k notes) | coder (Claude) |

## Bug Fixes

> Append one row whenever a bug fix touches this spec. Each row links to a `knowledge-base/fix-history/` entry created by `@bug-fixer`.

| Date | Issue | Fix Type | KB Entry | Affected ACs |
|------|-------|----------|----------|--------------|
