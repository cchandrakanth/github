# App Foundation — Expo Scaffold, SQLite, Adaptive Navigation

## Metadata

| Field | Value |
|-------|-------|
| **Status** | review |
| **Priority** | high |
| **Created** | 2026-07-11 |
| **Updated** | 2026-07-11 |
| **Author** | planner (Claude) |
| **GitHub Issue** | [#1](https://github.com/cchandrakanth/github/issues/1) |

## Properties

```yaml
responsive: mobile-first
auth-required: false
api-routes: []               # local-only app, no API routes
components: [src/app/_layout.tsx, src/app/(tabs)/*, src/components/nav/*, src/db/*]
```

## Summary

Bootstrap the "Improve My Notes App" universal Expo application: TypeScript + Expo Router + NativeWind, an on-device SQLite database (expo-sqlite + Drizzle ORM with migrations), and the adaptive navigation shell — bottom tab bar on phones, persistent side panel on web/wide screens. Every other spec builds on this foundation; it ships with empty placeholder screens for Notes, Search, Reminders, and Settings.

## User Stories

### US-1: Project scaffold

**As a** developer
**I want** a configured Expo + TypeScript + NativeWind + Expo Router project
**So that** all feature specs can be implemented on a consistent, tested base

#### Acceptance Criteria

- [ ] **AC-1.1**: `npx expo start` launches the app on iOS, Android, and web from a single codebase with no errors or warnings about misconfiguration
- [ ] **AC-1.2**: TypeScript strict mode is enabled and `npx tsc --noEmit` passes
- [ ] **AC-1.3**: NativeWind is configured (tailwind.config with design tokens) and a `className` style visibly applies on native and web
- [ ] **AC-1.4**: Import alias `@/` resolves to `src/` in app code and Jest
- [ ] **AC-1.5**: Jest (jest-expo) and React Native Testing Library run via `npm test` with a passing sample test

### US-2: Local database

**As a** user
**I want** my data stored on my device
**So that** the app works fully offline with no account

#### Acceptance Criteria

- [ ] **AC-2.1**: On first launch the app creates the SQLite database and applies all Drizzle migrations (schema per `schema.yml`)
- [ ] **AC-2.2**: On subsequent launches, pending migrations apply without data loss (verified by a migration test)
- [ ] **AC-2.3**: All database access goes through repository modules in `src/db/repositories/`; the SQLite driver is not imported anywhere else
- [ ] **AC-2.4**: Database operations use the async expo-sqlite API and do not block the UI thread

### US-3: Adaptive navigation

**As a** user
**I want** bottom tabs on my phone and a side panel on web/large screens
**So that** navigation feels native to whatever device I'm using

#### Acceptance Criteria

- [ ] **AC-3.1**: On viewports < 768px, a bottom tab bar shows: Notes, Search, Reminders, Settings — each with icon + label
- [ ] **AC-3.2**: On viewports ≥ 768px (web/tablet/desktop), the bottom bar is hidden and a persistent left side panel shows the same four destinations
- [ ] **AC-3.3**: Resizing a web browser window across the 768px breakpoint switches layouts live without losing the current screen or its state
- [ ] **AC-3.4**: The active destination is visually highlighted in both layouts
- [ ] **AC-3.5**: Each destination renders a placeholder screen with its title (content arrives in later specs)
- [ ] **AC-3.6**: Deep links / web URLs (e.g. `/search`) open the matching destination in both layouts

## Edge Cases

- **EC-1**: Device rotation on tablets crossing 768px (portrait↔landscape) must switch nav layout without crashing or losing screen state
- **EC-2**: Migration failure on startup shows a recoverable error screen instead of a white screen; the database is never left half-migrated (migrations run in a transaction)
- **EC-3**: Web reload on a nested route (e.g. `/note/123`) must render that route with the correct nav layout, not 404

## Out of Scope

- Any real feature content (notes, folders, search, reminders — own specs)
- Authentication, cloud sync, backup/export
- Dark mode theming polish (tokens are defined; full dark-mode QA is a later spec)

## Dependencies

- None (this is the root spec; all other specs depend on it)

## Questions

> Questions must be resolved before status can move from `draft` to `review`.

*(none — platform, database, UI library, and navigation decisions confirmed with the product owner on 2026-07-11)*

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-11 | Initial draft from onboarding decisions | planner (Claude) |

## Bug Fixes

> Append one row whenever a bug fix touches this spec. Each row links to a `knowledge-base/fix-history/` entry created by `@bug-fixer`.

| Date | Issue | Fix Type | KB Entry | Affected ACs |
|------|-------|----------|----------|--------------|
