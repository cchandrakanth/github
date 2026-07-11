# Notes CRUD & Rich-Text Editor — Styles & Layout

## Layout

### Mobile (base — 0-767px)

```
Notes list                          Editor
┌─────────────────────────┐        ┌─────────────────────────┐
│ Notes                   │        │ ←   {saved ✓}        ⋮  │
│ ┌─────────────────────┐ │        │ Title (text-xl bold)    │
│ │📌 Note title        │ │        │                         │
│ │  preview text…  2h  │ │        │ Rich text body…         │
│ ├─────────────────────┤ │        │                         │
│ │ Another note        │ │        │                         │
│ │  preview…      1d   │ │        ├─────────────────────────┤
│ └─────────────────────┘ │        │ B I U H1 H2 • 1. ☑     │ ← toolbar above keyboard
│                    (+)  │        └─────────────────────────┘
├─────────────────────────┤
│ tabs                    │
└─────────────────────────┘
```

### Web / Desktop (md+ — 768px+)

```
┌──────────┬──────────────────────────────┐
│ side     │ Notes            [New note]  │
│ panel    │ ┌──────────────────────────┐ │
│          │ │ note rows (max-w-3xl)    │ │
│          │ └──────────────────────────┘ │
│          │  Editor opens as a routed    │
│          │  page in the content area,   │
│          │  toolbar pinned at top       │
└──────────┴──────────────────────────────┘
```

## Component CSS Map

| Component | Element | Class / Selector | Notes |
|-----------|---------|-------------------|-------|
| NoteCard | container | `rounded-xl border border-border bg-background p-4 gap-1` | pressable, ripple on Android |
| NoteCard | title | `text-base font-semibold text-foreground` numberOfLines={1} | "Untitled" in muted when empty |
| NoteCard | preview | `text-sm text-muted-foreground` numberOfLines={2} | from body_text |
| NoteCard | meta | `text-xs text-muted-foreground` | relative time + 📌 when pinned |
| FAB | button | `absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg` | mobile only; web uses header button |
| EditorToolbar | container | `flex-row items-center gap-1 border-t border-border bg-background px-2 py-1` | sticks above keyboard (KeyboardAvoidingView) |
| EditorToolbar | button | `h-10 w-10 items-center justify-center rounded-md` | active format: `bg-primary/10 text-primary` |
| TitleInput | input | `text-xl font-bold text-foreground px-4 pt-4` | placeholder "Title" |
| EmptyState | container | `flex-1 items-center justify-center gap-3 p-8` | icon + "Create your first note" |
| TrashRow | actions | `text-primary` (Restore) / `text-destructive` (Delete forever) | confirm dialog on destructive |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `bg-background` | List and editor surfaces |
| Text | `text-foreground` | Titles, body |
| Muted | `text-muted-foreground` | Previews, timestamps |
| Border | `border-border` | Card outlines, toolbar divider |
| Accent | `bg-primary text-primary-foreground` | FAB, active toolbar buttons |
| Destructive | `text-destructive` | Delete forever |

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| `base` | Single-column list; FAB; toolbar docks above keyboard |
| `md:` | List `max-w-3xl mx-auto`; "New note" button in header instead of FAB; editor toolbar pinned at top of content |
| `lg:` | Content `max-w-4xl`; note list may show second metadata line |

## Accessibility

- Touch targets: 44x44px minimum on toolbar buttons, FAB, list actions
- Editor toolbar buttons expose `accessibilityLabel` ("Bold", "Checklist", …) and `accessibilityState={{ selected }}`
- Checklist checkboxes are toggleable via screen reader (role: checkbox)
- Color contrast: WCAG AA for preview/muted text; destructive actions distinguishable by label, not color alone
- Editor supports dynamic type / font scaling without clipping the toolbar
