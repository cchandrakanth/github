# Improve My Notes App

Mobile-first, offline-first personal notes app: rich-text notes, folders & tags, full-text search, and daily/weekly reminders with local push notifications. All data lives on-device in SQLite — no backend, no account.

One universal React Native codebase (Expo + Expo Router + NativeWind): bottom tab navigation on phones, a persistent side panel on web/wide screens.

## Run it

```bash
npm install
npx expo start        # scan the QR with Expo Go (iOS/Android)
npx expo start --web  # web mode (side panel layout; notifications are mobile-only)
```

Reminders need a real device or emulator — local notifications don't fire in a browser.

## Test it

```bash
npm test          # 72 Jest tests (repos, libs, components) on an in-memory SQLite
npm run typecheck # TypeScript strict
```

Maestro e2e flows are specified per feature in `specs/*/test.yml` (mobile flows require a device/emulator with the app installed).

## How this repo works

Spec-driven development: every feature has an approved spec in `specs/` (requirements, layout, schema, and test plan) before any code. See `specs/README.md` for the lifecycle, `CLAUDE.md` / `.github/` for the agent toolchain, and `knowledge-base/` for durable repo knowledge and fix history.

| Feature | Spec | Issue |
|---------|------|-------|
| App foundation (scaffold, SQLite, adaptive nav) | `specs/app-foundation` | #1 |
| Notes CRUD & rich-text editor | `specs/notes-crud` | #2 |
| Folders & tags | `specs/folders-tags` | #3 |
| Full-text search (FTS5) | `specs/search` | #4 |
| Note reminders & local notifications | `specs/note-reminders` | #5 |
