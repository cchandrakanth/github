# Full-Text Search — Styles & Layout

## Layout

### Mobile (base — 0-767px)

```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │ 🔍  groc         ✕  │ │  ← search bar, auto-focused
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ **Groc**eries       │ │  ← title, match bolded
│ │ …buy **groc**ery    │ │  ← snippet with highlight
│ │ bags… · Home        │ │  ← folder metadata
│ ├─────────────────────┤ │
│ │ next result…        │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ tabs                    │
└─────────────────────────┘
```

### Web / Desktop (md+ — 768px+)

```
┌────────────┬──────────────────────────┐
│ side panel │  search bar (max-w-2xl,  │
│            │  centered)               │
│            │  result rows (max-w-2xl) │
└────────────┴──────────────────────────┘
```

## Component CSS Map

| Component | Element | Class / Selector | Notes |
|-----------|---------|-------------------|-------|
| SearchBar | container | `mx-4 my-2 flex-row items-center gap-2 rounded-xl bg-muted px-3 py-2` | web: `md:max-w-2xl md:mx-auto` |
| SearchBar | input | `flex-1 text-base text-foreground` | placeholder "Search your notes" |
| SearchBar | clear | `h-8 w-8 items-center justify-center` | visible only when query non-empty |
| SearchResultRow | container | `px-4 py-3 border-b border-border gap-1` | pressable |
| SearchResultRow | title | `text-base font-semibold text-foreground` | `<mark>` spans: `bg-primary/20 rounded-sm` |
| SearchResultRow | snippet | `text-sm text-muted-foreground` numberOfLines={2} | highlights same as title |
| SearchResultRow | meta | `text-xs text-muted-foreground` | folder name |
| HintState / EmptyState | container | `flex-1 items-center justify-center gap-2 p-8` | icon + message |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `bg-background` | Screen |
| Input surface | `bg-muted` | Search bar field |
| Text | `text-foreground` | Titles, query text |
| Muted | `text-muted-foreground` | Snippets, hint/empty states |
| Highlight | `bg-primary/20` | Matched-term marks (AA contrast with `text-foreground`) |
| Border | `border-border` | Result separators |

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| `base` | Full-width bar and results; keyboard pushes list (KeyboardAvoiding) |
| `md:` | Bar + results centered at `max-w-2xl`; focus ring visible for keyboard users |
| `lg:` | Unchanged |

## Accessibility

- Search input: `accessibilityRole="search"`, clear button labeled "Clear search"
- Result count announced to screen readers when results update ("5 results")
- Highlights convey emphasis via `<mark>` semantics/bold, not color alone
- Result rows: full-row touch target ≥ 44px; keyboard Enter opens first result on web
