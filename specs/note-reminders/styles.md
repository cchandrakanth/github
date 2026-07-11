# Note Reminders & Local Notifications — Styles & Layout

## Layout

### Mobile (base — 0-767px)

```
Reminders tab                       Reminder picker (bottom sheet)
┌─────────────────────────┐        ┌─────────────────────────┐
│ Reminders               │        │ Remind me…              │
│ TODAY                   │        │ ◉ Once  ○ Daily ○ Weekly│
│ ┌─────────────────────┐ │        │ ┌─────────────────────┐ │
│ │ Morning routine     │ │        │ │  [date] [time]      │ │
│ │ Daily · 07:30   [●] │ │        │ │  (mode-specific)    │ │
│ ├─────────────────────┤ │        │ └─────────────────────┘ │
│ │ Water plants        │ │        │ Mon Tue Wed Thu Fri … │ │ ← weekday chips (weekly)
│ │ Weekly·Mon·18:00 [●]│ │        │                         │
│ UPCOMING                │        │ [Cancel]        [Save]  │
│ PAUSED                  │        └─────────────────────────┘
│ │ Old habit      [○]  │ │
├─────────────────────────┤
│ tabs                    │
└─────────────────────────┘
```

### Web / Desktop (md+ — 768px+)

```
┌────────────┬──────────────────────────────┐
│ side panel │ Reminders          ⓘ banner: │
│            │ "Notifications fire on the   │
│            │  mobile app"                 │
│            │ grouped rows (max-w-3xl)     │
│            │ picker opens as dialog       │
└────────────┴──────────────────────────────┘
```

## Component CSS Map

| Component | Element | Class / Selector | Notes |
|-----------|---------|-------------------|-------|
| SectionHeader | text | `px-4 pt-4 pb-1 text-xs font-semibold uppercase text-muted-foreground` | Today / Upcoming / Paused |
| ReminderRow | container | `flex-row items-center gap-3 px-4 py-3 border-b border-border` | pressable → owning note |
| ReminderRow | title | `text-base font-medium text-foreground` numberOfLines={1} | note title |
| ReminderRow | schedule | `text-sm text-muted-foreground` | "Daily · 07:30 · next 7:30 AM" |
| ReminderRow | toggle | Switch, `accessibilityLabel="Pause reminder"` | on: `bg-primary` track |
| ReminderPicker | sheet | bottom sheet (mobile) / centered dialog (web), `p-4 gap-4` | |
| ModeSelector | segmented | `flex-row rounded-lg bg-muted p-1` items `flex-1 rounded-md py-2` | active: `bg-background shadow-sm` |
| WeekdayChips | chip | `h-10 w-10 items-center justify-center rounded-full border border-border` | selected: `bg-primary text-primary-foreground` |
| ValidationError | text | `text-xs text-destructive` | past-datetime error (AC-1.5) |
| PermissionBanner | container | `mx-4 my-2 rounded-lg bg-muted p-3 flex-row gap-2` | link to system settings |
| EditorReminderChip | chip | `flex-row items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary` | ⏰ + summary, in note editor |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `bg-background` | Screen, sheets |
| Text | `text-foreground` | Row titles |
| Muted | `text-muted-foreground` | Schedules, section headers, banners |
| Border | `border-border` | Row separators, weekday chips |
| Accent | `bg-primary text-primary-foreground` | Active toggle, selected weekday, save button |
| Destructive | `text-destructive` | Validation errors, delete action |

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| `base` | Full-width grouped list; picker as bottom sheet |
| `md:` | List `max-w-3xl mx-auto`; picker as dialog; web-limitation banner shown (EC-6) |
| `lg:` | Unchanged |

## Accessibility

- Toggle rows: switch state announced ("Morning routine, daily 7:30, reminder on")
- Weekday chips ≥ 44px, `accessibilityRole="button"` with selected state
- Date/time pickers use platform-native accessible controls
- Permission banner actionable via screen reader; not color-only signaling
- Notification content readable by OS accessibility features (plain text title/body)
