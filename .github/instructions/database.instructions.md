---
description: "Use when creating or modifying database operations, schema definitions, or access rules. Adapts to the database and ORM in project-config.json."
---

# Database Standards

> Read `project-config.json` for: `database.primary`, `database.orm`, `database.dataPattern`, `database.caching`.
> Adapt query patterns, schema definitions, and access rules to the configured database and ORM.

## Data Access Pattern

All database access should go through a service/data layer — not called directly from UI components.

## Rules

- Never access the database directly from client components — use API routes or server actions
- Scope data access to the authenticated user where applicable
- Schema/type definitions must match actual database documents/tables
- Access rules must enforce per-user isolation (where applicable)
- Use proper timestamp types for date fields
- Use meaningful IDs where possible (not always auto-generated)
- Batch writes for multi-document/row updates
- All queries should use indexed fields for performance
- Validate data shape at the service layer boundary
