# Performance Checklist

Customize for your project's tech stack after running `/onboard`.

## Server vs Client Rendering

- [ ] Default to server-side rendering — only add client directives when needed
- [ ] Client-side components are as small as possible
- [ ] No client-side directives on pages that don't need interactivity

## Bundle Size

- [ ] No unused packages in dependency manifest
- [ ] Tree-shaking: use named imports, not wildcard (`import { X }` not `import *`)
- [ ] Heavy libraries dynamically imported / lazy loaded
- [ ] Icons imported individually, not as entire sets
- [ ] No duplicate functionality (e.g., both `date-fns` and `dayjs`)

## Rendering

- [ ] Lists use `key` props correctly (not array index for dynamic lists)
- [ ] Expensive computations memoized when dependencies rarely change
- [ ] Event handlers stable when passed to memoized children
- [ ] No unnecessary state updates in effects
- [ ] Polling intervals reasonable (10s+ for non-critical data)

## Data Loading

- [ ] Local cache hydration prevents loading flash (paint before fetch)
- [ ] API responses cached where appropriate (Cache-Control headers)
- [ ] Batch API calls preferred over sequential
- [ ] Database queries use indexes for filtered/sorted queries
- [ ] No N+1 query patterns (fetching related data in a loop)

## Images & Assets

- [ ] All images use framework's optimized image component
- [ ] Fonts loaded through framework font optimization (no external CDN)
- [ ] SVG icons inline or loaded efficiently

## Targets

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Mobile | ≥ 90 | Chrome DevTools |
| FCP | < 1.5s | Lighthouse |
| TTI | < 3.5s | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| JS Bundle (per page) | < 200KB gzipped | Build output |
