---
description: "Use when creating or modifying database operations, relational SQL schemas, migrations, Row-Level Security (RLS) policies, CHECK/GENERATED constraints, triggers, or document collections. Adapts to the database and ORM in project-config.json."
applyTo: "**/{db,database,schema,migrations,prisma,drizzle,models,repositories,sql}/**/*.{ts,js,py,go,rs,sql,prisma,yml}"
---

# Database & Schema Standards

> Read `project-config.json` for: `database.primary`, `database.localOffline`, `database.orm`, `database.dataPattern`, `database.caching`.
> Adapt query patterns, ORM definitions, migrations, and access rules to the configured database engine and ORM.

## Data Access Pattern

- All database access MUST go through a dedicated service, repository, or data-access layer — never call the database or ORM directly from UI components.
- Never access the server database directly from client components — route through API endpoints, server actions, or typed IPC channels.
- Validate all inputs at the service boundary before executing queries or mutations.

## Relational / SQL Databases (PostgreSQL, MySQL, SQLite, Supabase, Cloud SQL)

When `database.primary` (or `database.localOffline`) is a relational SQL database:

1. **ORM + Raw SQL Migrations**:
   - Keep ORM schema definitions (`Prisma`, `Drizzle`, `SQLAlchemy`, `TypeORM`, etc.) in sync with versioned SQL migration files.
   - When using database features that ORMs do not natively express (`ROW LEVEL SECURITY`, `GENERATED ALWAYS AS (...) STORED`, complex `CHECK` constraints, partial indexes, or `BEFORE UPDATE OR DELETE` triggers), include explicit SQL statements in the migration file and document them in `specs/{feature}/schema.yml` under `tables`.
2. **Row-Level Security (RLS) & Multi-Tenant Isolation**:
   - When `database.dataPattern` specifies per-user or per-tenant RLS (e.g., PostgreSQL / Supabase), enable `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on every tenant-scoped table.
   - Scope policies to the authenticated session context (e.g., `current_setting('app.current_user_id', true)` or `auth.uid()`), set inside a transaction (`SET LOCAL`).
3. **Schema & Enclave Boundaries**:
   - When a project separates database schemas by privilege or compliance domain (e.g., tenant/protected schema vs. public/catalog schema), enforce strict schema isolation and never join across restricted boundaries unless explicitly allowed by `architecture.patterns`.
4. **Declarative Data Integrity & Immutability**:
   - Prefer database-level `NOT NULL`, `FOREIGN KEY`, `UNIQUE`, `CHECK (...)` constraints, and `GENERATED ALWAYS` columns over application-only checks.
   - When a spec requires append-only audit logs or immutable/WORM records, enforce immutability at the database layer via `BEFORE UPDATE OR DELETE` triggers that raise an exception when a row is locked/sealed.
5. **Local / Offline Databases**:
   - When `database.localOffline` is configured (e.g., SQLite, SQLCipher, WatermelonDB, IndexedDB), encrypt sensitive local stores at rest and synchronize through explicit sync/IPC boundaries.

## Document / NoSQL Databases (Firestore, MongoDB, DynamoDB)

When `database.primary` is a document or key-value store:

- Define collection paths, document field types, validation constraints, composite indexes, and security/access rules in `specs/{feature}/schema.yml` under `collections`.
- Enforce per-user or per-tenant ownership in security rules (e.g., `firestore.rules`) as well as in server-side queries.
- Avoid unbounded arrays, unindexed queries, and sequential round-trips; prefer batch reads/writes and composite indexes.

## General Rules

- Use proper timezone-aware timestamp types (`TIMESTAMPTZ` in SQL, server timestamps in NoSQL) for `created_at` / `updated_at`.
- Every query on large tables/collections must be backed by an index declared in `schema.yml`.
- Never log raw database rows, connection strings, or sensitive user fields in error logs.
