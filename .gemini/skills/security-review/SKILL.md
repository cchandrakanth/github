---
name: security-review
description: "Run OWASP security audit on code. Use when reviewing security, checking for vulnerabilities, auditing auth flows, or scanning for exposed secrets."
argument-hint: "File path or feature name to audit"
---

# Security Review Skill

## When to Use

- Before merging any feature to production
- After implementing auth-related changes
- When adding new API routes
- Periodic security audits

## Procedure

### Quick Scan (Single File/Route)

1. Read the target file
2. Check against [OWASP checklist](./references/owasp-checklist.md)
3. Report findings with severity

### Full Audit (Feature)

1. Read `specs/{feature}/spec.md` for scope
2. Identify all files in the feature (components, API routes, hooks)
3. For each API route:
   - Verify auth/session validation call
   - Check input validation
   - Check error response format (no stack traces)
4. For each client component:
   - Scan for secrets or API keys
   - Check for XSS vectors (innerHTML, unescaped user input)
5. Check database access patterns for user isolation
6. Report findings

### Dependency Scan

```bash
# JavaScript/TypeScript
npm audit
npx depcheck

# Python
pip-audit
safety check
```

## References

- [OWASP Checklist](./references/owasp-checklist.md)
