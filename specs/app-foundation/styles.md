# App Foundation — Styles & Layout

## Layout

### Mobile (base — 0-767px)

```
┌─────────────────────────┐
│  Screen header          │
│                         │
│  {active screen}        │
│                         │
│                         │
├─────────────────────────┤
│ 📝     🔍     ⏰     ⚙️  │  ← bottom tab bar (56px + safe area)
│Notes Search Remind. Set.│
└─────────────────────────┘
```

### Web / Tablet / Desktop (md+ — 768px+)

```
┌────────────┬───────────────────────────┐
│  App name  │  Screen header            │
│            │                           │
│ ▸ 📝 Notes │  {active screen}          │
│   🔍 Search│                           │
│   ⏰ Remind│                           │
│   ⚙️ Settin│                           │
│            │                           │
│ (240px)    │  content max-w-3xl        │
└────────────┴───────────────────────────┘
```

## Component CSS Map

| Component | Element | Class / Selector | Notes |
|-----------|---------|-------------------|-------|
| TabBar | container | `flex-row border-t border-border bg-background` | hidden at `md:` via layout switch |
| TabBar | item | `flex-1 items-center justify-center py-2` | min 44x44px touch target |
| SidePanel | container | `w-60 border-r border-border bg-background h-full` | rendered only ≥768px |
| SidePanel | item | `flex-row items-center gap-3 rounded-lg px-3 py-2` | active: `bg-primary/10 text-primary` |
| ScreenShell | content | `flex-1 bg-background` | web: `md:max-w-3xl md:mx-auto` for readable line length |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `bg-background` | Main content area |
| Text | `text-foreground` | Primary text |
| Muted | `text-muted-foreground` | Secondary text, inactive tabs |
| Border | `border-border` | Tab bar / side panel dividers |
| Accent | `bg-primary text-primary-foreground` | Active nav item, FAB, CTAs |

Tokens are defined once in `tailwind.config.js` (light + dark palettes) and consumed only via NativeWind classes — no hard-coded hex values in components.

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| `base` | Bottom tab bar, full-width content |
| `md:` (768px) | Bottom bar hidden; persistent 240px side panel; content centered with max width |
| `lg:` (1024px) | Side panel unchanged; content max width grows to `max-w-4xl` |

Breakpoint detection uses `useWindowDimensions()` so it is live on window resize and rotation (AC-3.3, EC-1).

## Accessibility

- Touch targets: minimum 44x44px on all nav items
- Color contrast: WCAG AA (4.5:1) for labels in both active and inactive states
- Focus indicators: visible focus ring on side panel items (web keyboard nav)
- Screen reader: nav items expose `accessibilityRole="tab"`/link and `accessibilityState={{ selected }}`
