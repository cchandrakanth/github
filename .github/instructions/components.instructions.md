---
description: "Use when creating or modifying UI components. Covers component structure, co-location, and responsive patterns. Adapts to the frontend framework in project-config.json."
applyTo: "components/**/*.{tsx,vue,svelte,jsx,ts,js}"
---

# Component Standards

> Read `project-config.json` for: `techStack.frontend`, `techStack.language`, `ui.framework`, `ui.designSystem`, `ui.responsiveTarget`, `conventions.importAlias`.
> Adapt component patterns, file extensions, and directory structures to the configured frontend framework.

## Structure

Feature components live in a feature directory with co-located files:

```
components/{feature}/
  types.ts          # Feature-scoped types
  helpers.ts        # Feature-scoped pure functions
  use{Feature}.ts   # Feature hook (state + effects)
  {Component}.tsx   # UI components (props-driven)
  index.ts          # Barrel export
```

## Rules

- Page files should be thin orchestrators that compose components
- Components receive data via props — no direct API/DB calls inside UI components
- State management belongs in custom hooks, not in component bodies
- Only use client-side directives when state, effects, or browser APIs are needed
- Responsive design: design for smallest screen first, scale up with breakpoints
- Import from barrel exports where available
- Never modify files in the UI primitive library (shadcn, MUI, etc.)
