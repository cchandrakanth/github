# {Feature Name} — Styles & CSS

## Layout

### Mobile (base — 0-639px)

```
{ASCII wireframe or description of mobile layout}
```

### Tablet (sm/md — 640-1023px)

```
{ASCII wireframe or description of tablet layout}
```

### Desktop (lg+ — 1024px+)

```
{ASCII wireframe or description of desktop layout}
```

## Component CSS Map

| Component | Element | Class / Selector | Notes |
|-----------|---------|-------------------|-------|
| {ComponentName} | container | `className="..."` | {layout notes} |
| {ComponentName} | title | `className="..."` | {typography notes} |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `bg-background` | Main content area |
| Text | `text-foreground` | Primary text |
| Muted | `text-muted-foreground` | Secondary text |
| Border | `border-border` | Dividers and outlines |
| Accent | `bg-primary text-primary-foreground` | CTAs and highlights |

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| `base` | {mobile layout description} |
| `sm:` | {what changes at 640px} |
| `md:` | {what changes at 768px} |
| `lg:` | {what changes at 1024px} |

## Accessibility

- Touch targets: minimum 44x44px
- Color contrast: WCAG AA (4.5:1 for text)
- Focus indicators: visible on all interactive elements
- Screen reader: proper aria labels on custom controls

## Animations

| Element | Trigger | Animation | Duration |
|---------|---------|-----------|----------|
| {element} | {hover/mount/etc} | {description} | {ms} |
