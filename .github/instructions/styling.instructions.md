---
description: "Use when working with CSS, styling, responsive design, or theming. Adapts to the UI framework in project-config.json."
applyTo: "**/*.{css,scss,less,module.css}"
---

# Styling Standards

> Read `project-config.json` for: `ui.framework`, `ui.responsiveTarget`, `ui.designSystem`.
> Use the configured UI framework for all styling patterns. Apply the responsive target (mobile-first, desktop-first, etc.) as the default.

## Responsive Design

All UIs default to responsive unless spec explicitly overrides.

```
Default breakpoint thinking:
  base (0px)     — Mobile phones (320-479px)
  sm (640px)     — Large phones
  md (768px)     — Tablets
  lg (1024px)    — Desktop
  xl (1280px)    — Large desktop
```

## Rules

- Use the project's chosen CSS framework (Tailwind utilities, CSS modules, etc.)
- Design for smallest supported screen first, add breakpoints for larger screens
- Touch targets minimum 44x44px on mobile
- Font sizes: minimum 14px on mobile
- Use semantic design tokens for colors (foreground, background, muted, etc.)
- Support dark mode via the project's theming system
- UI primitive components handle their own theming — don't override

## Accessibility

- Color contrast: WCAG AA (4.5:1 for text)
- Focus indicators: visible on all interactive elements
- Screen reader: proper aria labels on custom controls
- Keyboard navigation: all interactive elements reachable via tab
