---
description: "Review implementation against spec — check code quality, security, and performance"
agent: "reviewer"
argument-hint: "Spec name (folder name under specs/)"
---

Review the implementation of the specified feature against its spec.

## Instructions

1. Read all 4 spec files in `specs/{feature-name}/`
2. Identify all source files created/modified for this feature
3. Run review checklist:
   - Every AC implemented?
   - CSS matches styles.md?
   - Security rules followed?
   - Performance acceptable?
   - Responsive design correct?
4. Report findings with severity levels
5. **Sync GitHub**: Comment on linked issue with review findings summary
6. If review passes and human confirms completion (`verified` → `completed`), update linked issue: close it and remove all spec labels
