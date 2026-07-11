# Note Reminders & Local Notifications

## Metadata

| Field | Value |
|-------|-------|
| **Status** | implemented |
| **Priority** | high |
| **Created** | 2026-07-11 |
| **Updated** | 2026-07-11 |
| **Author** | planner (Claude) |
| **GitHub Issue** | [#5](https://github.com/cchandrakanth/github/issues/5) |

## Properties

```yaml
responsive: mobile-first
auth-required: false
api-routes: []
components: [src/app/(tabs)/reminders.tsx, src/components/ReminderPicker.tsx, src/components/ReminderRow.tsx, src/db/repositories/remindersRepo.ts, src/lib/notifications.ts]
```

## Summary

Any note can carry reminders that fire **local push notifications** (expo-notifications — no server involved): one-off ("Sat 9:00"), daily ("every day 07:30"), or weekly ("every Monday 18:00"). This turns notes into a lightweight daily/weekly routine and reminder system. The Reminders tab lists all upcoming reminders; tapping a notification opens the note. Every scheduled notification's OS identifier is persisted on its reminder row so reschedules and cancellations are deterministic. Reminders are mobile-only in v1 — on web the UI shows reminder configs with a "notifications work on the mobile app" notice.

## User Stories

### US-1: Set a reminder on a note

**As a** user
**I want** to attach a one-off, daily, or weekly reminder to a note
**So that** the app nudges me about routines (daily activities, weekly errands) and deadlines

#### Acceptance Criteria

- [ ] **AC-1.1**: The note editor has an "Add reminder" control opening a picker with three modes: Once (date + time), Daily (time), Weekly (weekday + time)
- [ ] **AC-1.2**: The first time a reminder is saved, the app requests notification permission with an in-context explanation; on grant the reminder schedules, on denial the reminder saves as disabled with a banner explaining how to enable notifications in system settings
- [ ] **AC-1.3**: Saving a reminder schedules a local notification (title = note title or "Reminder", body = first line of note text) and stores the returned notification id on the reminder row
- [ ] **AC-1.4**: A note can have multiple reminders (e.g. daily 08:00 + weekly Sunday 20:00); each is listed in the editor with its schedule summary
- [ ] **AC-1.5**: A one-off reminder in the past cannot be saved (inline validation)

### US-2: Reminders fire reliably

**As a** user
**I want** notifications to arrive on schedule and open the right note
**So that** I can trust the app as my reminder system

#### Acceptance Criteria

- [ ] **AC-2.1**: Daily reminders fire every day at the chosen time; weekly reminders fire on the chosen weekday and time; once reminders fire exactly once at their datetime — all verified with the app closed (killed)
- [ ] **AC-2.2**: Tapping a notification opens the app directly on that note's editor (deep link), from cold start or background
- [ ] **AC-2.3**: After a once reminder fires, its row shows as completed/expired in the UI and holds no scheduled notification
- [ ] **AC-2.4**: On app launch, a reconciliation sweep re-schedules any enabled reminder missing its OS notification (e.g. after device reboot or app data restore) and clears orphaned scheduled notifications with no matching reminder row

### US-3: Manage reminders

**As a** user
**I want** one place to see, pause, edit, and delete all my reminders
**So that** my notification load stays under my control

#### Acceptance Criteria

- [ ] **AC-3.1**: The Reminders tab lists all reminders grouped: Today, Upcoming, Paused — each row shows note title, schedule summary (e.g. "Daily · 07:30", "Weekly · Mon · 18:00"), and next fire time
- [ ] **AC-3.2**: A toggle on each row pauses/resumes: pause cancels the scheduled notification (config kept, `enabled=0`); resume re-schedules and stores the new notification id
- [ ] **AC-3.3**: Editing a reminder's schedule cancels the old notification and schedules a new one atomically (no double-fire, no gap)
- [ ] **AC-3.4**: Deleting a reminder (or its note — see notes-crud AC-4.4) cancels its scheduled notification
- [ ] **AC-3.5**: Tapping a reminder row opens the owning note

## Edge Cases

- **EC-1**: Device reboot — OS may drop scheduled notifications; the AC-2.4 launch sweep restores them
- **EC-2**: Timezone change / DST shift — daily/weekly reminders fire at the local wall-clock time chosen (07:30 stays 07:30); launch sweep re-schedules when offsets change
- **EC-3**: Permission revoked in system settings after reminders exist — app detects on launch/foreground, shows the re-enable banner, keeps configs intact
- **EC-4**: Note in Trash — its reminders' notifications are cancelled on soft delete; restore re-schedules enabled ones
- **EC-5**: Weekly reminder saved for "today at an earlier time" schedules next week's occurrence, not the past
- **EC-6**: Web platform — reminder CRUD works, no notifications scheduled; UI states this clearly (v1 limitation)

## Out of Scope

- Server/remote push notifications (no backend in v1)
- Snooze, custom repeat intervals (every N days, monthly), multiple times per day per reminder
- Notification actions (complete/snooze buttons) — v2
- Cross-device reminder sync

## Dependencies

- `specs/app-foundation` — `reminders` table (see its schema.yml), navigation shell
- `specs/notes-crud` — note editor (picker entry point), trash cascade behavior
- expo-notifications (local scheduling), expo-device (permission handling)

## Questions

> Questions must be resolved before status can move from `draft` to `review`.

*(none — note-attached reminders with daily/weekly recurrence and local notifications confirmed with the product owner on 2026-07-11)*

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-11 | Initial draft from onboarding decisions | planner (Claude) |
| 2026-07-11 | Approved by product owner; implemented. v1 picker uses validated text inputs for date/time (platform-native pickers deferred to keep web + Expo Go parity); AC-2.1/E2E-3 wall-clock verification remains a manual device test | coder (Claude) |

## Bug Fixes

> Append one row whenever a bug fix touches this spec. Each row links to a `knowledge-base/fix-history/` entry created by `@bug-fixer`.

| Date | Issue | Fix Type | KB Entry | Affected ACs |
|------|-------|----------|----------|--------------|
