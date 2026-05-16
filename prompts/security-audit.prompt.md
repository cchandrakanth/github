---
description: "Run a security audit on a file, feature, or the entire project"
agent: "security"
argument-hint: "File path, feature name, or 'full' for complete audit"
---

Run a security audit on the specified scope.

## Instructions

1. If scope is a file: audit that single file
2. If scope is a feature: read spec, find all related files, audit each
3. If scope is 'full': audit all API routes, auth flow, client components
4. Use OWASP checklist from `skills/security-review/references/owasp-checklist.md`
5. Report findings with severity and remediation steps
