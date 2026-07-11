# Folders & Tags — Styles & Layout

## Layout

### Mobile (base — 0-767px)

```
┌─────────────────────────┐
│ Notes                   │
│ ◦All ◦Unfiled ◦Work ◦+  │  ← horizontal folder chip row (scrollable)
│ #urgent ✕               │  ← active tag filter bar (only when filtering)
│ ┌─────────────────────┐ │
│ │ Note title          │ │
│ │ preview…  #tag #tag │ │  ← tag chips on card
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Web / Desktop (md+ — 768px+)

```
┌────────────┬────────────────────────┐
│ Notes      │ Notes · Work           │
│ Search     │ ┌────────────────────┐ │
│ Reminders  │ │ note rows          │ │
│ Settings   │ └────────────────────┘ │
│ ────────── │                        │
│ FOLDERS    │                        │
│  All (24)  │  ← folder section in side panel
│  Unfiled(3)│                        │
│  Work (12) │                        │
│  + New     │                        │
└────────────┴────────────────────────┘
```

## Component CSS Map

| Component | Element | Class / Selector | Notes |
|-----------|---------|-------------------|-------|
| FolderChipRow | container | `flex-row gap-2 px-4 py-2` in horizontal ScrollView | mobile only |
| FolderChip | chip | `rounded-full border border-border px-3 py-1.5` | active: `bg-primary text-primary-foreground border-primary` |
| SidePanel folder item | row | `flex-row justify-between rounded-lg px-3 py-2` | count in `text-muted-foreground text-xs` |
| TagChip | chip | `rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary` | prefix rendered as '#'; tap = filter |
| TagPicker | sheet | bottom sheet (mobile) / popover (web), `gap-2 p-4` | search input + tag list + "Create '<name>'" row |
| FolderSelector | control | `flex-row items-center gap-2 rounded-lg border border-border px-3 py-2` | in editor header area |
| InlineError | text | `text-xs text-destructive` | duplicate name validation |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `bg-background` | Sheets, popovers |
| Text | `text-foreground` | Folder names |
| Muted | `text-muted-foreground` | Counts, placeholder |
| Border | `border-border` | Chips, selector outlines |
| Accent | `bg-primary text-primary-foreground` | Active folder chip; tag chips use `bg-primary/10 text-primary` |
| Destructive | `text-destructive` | Delete folder/tag confirmations, validation errors |

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| `base` | Folder chip row above notes list; tag picker as bottom sheet |
| `md:` | Folder chip row hidden; folders live in side panel section; tag picker as anchored popover |
| `lg:` | Unchanged; side panel folder section shows counts right-aligned |

## Accessibility

- Chips and side-panel rows: 44px minimum touch height, `accessibilityRole="button"`, active state via `accessibilityState={{ selected }}`
- Folder/tag counts announced with the name ("Work, 12 notes")
- Inline validation errors linked to the input via accessible label, not color alone
- Horizontal chip row remains keyboard-navigable on web (arrow keys / tab)
