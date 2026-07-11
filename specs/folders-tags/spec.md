# Folders & Tags

## Metadata

| Field | Value |
|-------|-------|
| **Status** | review |
| **Priority** | medium |
| **Created** | 2026-07-11 |
| **Updated** | 2026-07-11 |
| **Author** | planner (Claude) |
| **GitHub Issue** | [#3](https://github.com/cchandrakanth/github/issues/3) |

## Properties

```yaml
responsive: mobile-first
auth-required: false
api-routes: []
components: [src/app/folder/[id].tsx, src/components/FolderList.tsx, src/components/TagChip.tsx, src/components/TagPicker.tsx, src/db/repositories/foldersRepo.ts, src/db/repositories/tagsRepo.ts]
```

## Summary

Organize notes two ways: **folders** (each note lives in at most one folder — like notebooks) and **tags** (each note can carry many — like labels). Folders are managed from the Notes screen (a horizontal folder row on mobile; a folder section inside the side panel on web). Tags are assigned from the note editor and can filter the notes list. Both are flat in v1 — no nesting.

## User Stories

### US-1: Manage folders

**As a** user
**I want** to create, rename, reorder, and delete folders
**So that** I can group related notes (e.g. Work, Personal, Weekly Planning)

#### Acceptance Criteria

- [ ] **AC-1.1**: Users can create a folder by name; names are trimmed, non-empty, and unique case-insensitively — duplicates show an inline error
- [ ] **AC-1.2**: Folders can be renamed (same validation) and manually reordered; the order persists across restarts
- [ ] **AC-1.3**: Deleting a folder asks for confirmation and moves its notes to Unfiled (never deletes notes)
- [ ] **AC-1.4**: The Notes screen shows folder navigation: "All", "Unfiled", then folders in order, each with a live note count (mobile: horizontal chip row; web/wide: section in the side panel)

### US-2: File notes into folders

**As a** user
**I want** to assign a note to a folder
**So that** it shows up where I expect it

#### Acceptance Criteria

- [ ] **AC-2.1**: The note editor exposes a folder selector (current folder shown; tap to change; "Unfiled" option)
- [ ] **AC-2.2**: Selecting a folder in the folder navigation filters the notes list to that folder, preserving the pinned-first sort
- [ ] **AC-2.3**: Moving a note between folders updates both folders' counts immediately

### US-3: Tag notes

**As a** user
**I want** to add multiple tags to a note and filter by tag
**So that** one note can belong to several themes (e.g. #urgent, #shopping)

#### Acceptance Criteria

- [ ] **AC-3.1**: The editor's tag picker lets me attach existing tags or create a new one inline; tag names are trimmed, unique case-insensitively, and stored without a leading '#'
- [ ] **AC-3.2**: A note's tags render as chips in the editor and on the note card in lists
- [ ] **AC-3.3**: Tapping a tag chip filters the notes list to that tag
- [ ] **AC-3.4**: Removing a tag from a note deletes only the link; deleting a tag entirely (from tag management) asks for confirmation and removes it from all notes
- [ ] **AC-3.5**: Tag filter and folder filter compose (e.g. folder "Work" + tag "urgent")

## Edge Cases

- **EC-1**: Deleting a folder that is the currently active filter resets the filter to "All" without crashing
- **EC-2**: Creating a tag that differs only by case ("Urgent" vs "urgent") reuses the existing tag instead of erroring or duplicating
- **EC-3**: A note in Trash keeps its folder/tag links so Restore returns it fully intact; trashed notes are excluded from folder/tag counts
- **EC-4**: 50+ folders/tags — pickers stay scrollable and searchable, chip rows scroll horizontally

## Out of Scope

- Nested folders / tag hierarchies (v2)
- Bulk move/tag operations on multiple notes (v2)
- Tag colors UI (schema supports a color token; UI deferred)

## Dependencies

- `specs/app-foundation` — `folders`, `tags`, `note_tags` tables (see its schema.yml)
- `specs/notes-crud` — notes list and editor these controls attach to

## Questions

> Questions must be resolved before status can move from `draft` to `review`.

*(none — flat folders + many-to-many tags confirmed with the product owner on 2026-07-11)*

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-11 | Initial draft from onboarding decisions | planner (Claude) |

## Bug Fixes

> Append one row whenever a bug fix touches this spec. Each row links to a `knowledge-base/fix-history/` entry created by `@bug-fixer`.

| Date | Issue | Fix Type | KB Entry | Affected ACs |
|------|-------|----------|----------|--------------|
