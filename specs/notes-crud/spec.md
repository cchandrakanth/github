# Notes CRUD & Rich-Text Editor

## Metadata

| Field | Value |
|-------|-------|
| **Status** | implemented |
| **Priority** | high |
| **Created** | 2026-07-11 |
| **Updated** | 2026-07-11 |
| **Author** | planner (Claude) |
| **GitHub Issue** | [#2](https://github.com/cchandrakanth/github/issues/2) |

## Properties

```yaml
responsive: mobile-first
auth-required: false
api-routes: []
components: [src/app/(tabs)/index.tsx, src/app/note/[id].tsx, src/app/trash.tsx, src/components/NoteCard.tsx, src/components/editor/*, src/db/repositories/notesRepo.ts]
```

## Summary

The heart of the app: create, view, edit, and delete notes with a rich-text (WYSIWYG) editor. The Notes tab lists all notes newest-first (pinned first); tapping a note opens the editor; a FAB creates a new note. Deleting moves a note to Trash (soft delete) where it can be restored or removed forever. Content autosaves — there is no explicit save button. Rich text is stored as sanitized HTML with a plain-text projection maintained for search (see `specs/app-foundation/schema.yml`).

## User Stories

### US-1: Create a note

**As a** user
**I want** to quickly capture a new note
**So that** I never lose a thought or a to-do

#### Acceptance Criteria

- [ ] **AC-1.1**: A FAB (mobile) / "New note" button (side panel layout) on the Notes screen opens a blank editor with the title focused
- [ ] **AC-1.2**: The note autosaves (debounced ≤ 1s after typing stops) — killing the app after typing loses at most the last second of input
- [ ] **AC-1.3**: A note left completely empty (no title, no body) is discarded on exit instead of cluttering the list
- [ ] **AC-1.4**: A new note appears at the top of the Notes list immediately after leaving the editor

### US-2: Edit with rich text

**As a** user
**I want** basic formatting — bold, italic, underline, headings, bullet/numbered lists, and checklists
**So that** my notes and daily activity lists are structured and readable

#### Acceptance Criteria

- [ ] **AC-2.1**: The editor toolbar offers: bold, italic, underline, H1/H2, bulleted list, numbered list, checklist — each applies WYSIWYG (no visible markup)
- [ ] **AC-2.2**: Checklist items toggle checked/unchecked by tapping the checkbox, in the editor view, and the state persists
- [ ] **AC-2.3**: Formatting round-trips: close and reopen a formatted note and it renders identically
- [ ] **AC-2.4**: Saved HTML is sanitized (allow-list of tags/attributes); script/iframe/event-handler content can never be stored or rendered
- [ ] **AC-2.5**: `body_text` (plain-text projection) is regenerated on every save so search stays accurate

### US-3: Browse and manage notes

**As a** user
**I want** a scannable list of my notes with pin and delete actions
**So that** I can find and manage what I've written

#### Acceptance Criteria

- [ ] **AC-3.1**: The Notes list shows each note's title (or "Untitled"), a 2-line plain-text preview, and relative updated time, sorted pinned-first then newest-updated-first
- [ ] **AC-3.2**: The list is virtualized and stays smooth (60fps target) with 1,000+ notes
- [ ] **AC-3.3**: Long-press (mobile) / hover overflow menu (web) offers Pin/Unpin and Delete
- [ ] **AC-3.4**: Pinned notes show a pin indicator and group at the top
- [ ] **AC-3.5**: Empty state (no notes) shows a friendly prompt pointing at the create action

### US-4: Trash

**As a** user
**I want** deleted notes to go to a Trash I can restore from
**So that** an accidental delete never destroys my data

#### Acceptance Criteria

- [ ] **AC-4.1**: Delete sets `deleted_at` (soft delete); the note disappears from all lists and search but appears in Trash
- [ ] **AC-4.2**: Trash (reachable from Settings) lists deleted notes with Restore and Delete forever actions
- [ ] **AC-4.3**: Delete forever requires a confirmation dialog and permanently removes the note, its tag links, and its reminders (cascade)
- [ ] **AC-4.4**: Deleting a note cancels any scheduled notifications for its reminders

## Edge Cases

- **EC-1**: Very large note (100k+ characters) — editor stays responsive; autosave debounce prevents write storms
- **EC-2**: App killed mid-edit — on relaunch the note shows the last autosaved state, never a corrupted document
- **EC-3**: Pasting formatted content from another app — unsupported tags are stripped by sanitization, text content preserved
- **EC-4**: Two editor entries to the same note (e.g. web multi-tab) — last write wins; no crash
- **EC-5**: Editor unavailable (WebView failed to load) — show plain-text fallback editor rather than losing edit access

## Out of Scope

- Folders/tags assignment UI (spec `folders-tags`)
- Search (spec `search`)
- Reminders UI (spec `note-reminders`)
- Images/attachments, drawing, audio notes (v2 candidates)
- Auto-emptying Trash after N days (v2)

## Dependencies

- `specs/app-foundation` — navigation shell, database schema (`notes` table), repositories layout
- Rich-text editor component: TipTap-based `@10play/tentap-editor` on native (WebView); TipTap directly on web — final library choice validated during implementation against AC-2.x

## Questions

> Questions must be resolved before status can move from `draft` to `review`.

*(none — WYSIWYG editing, autosave, and trash behavior confirmed with the product owner on 2026-07-11)*

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-11 | Initial draft from onboarding decisions | planner (Claude) |
| 2026-07-11 | Approved by product owner; implemented (editor + autosave + trash; native WYSIWYG via tentap, plain-text web fallback per EC-5) | coder (Claude) |

## Bug Fixes

> Append one row whenever a bug fix touches this spec. Each row links to a `knowledge-base/fix-history/` entry created by `@bug-fixer`.

| Date | Issue | Fix Type | KB Entry | Affected ACs |
|------|-------|----------|----------|--------------|
