---
name: relational-db
description: "Relational database schema design, SQL migrations, Row-Level Security (RLS), CHECK/GENERATED constraints, immutability/audit triggers, ORM integration (Drizzle, Prisma, SQLAlchemy), local offline SQLite/SQLCipher, and PGlite/container integration testing. Use when database.primary or database.localOffline is PostgreSQL, MySQL, SQLite, Supabase, or Cloud SQL."
argument-hint: "Feature name, table name, or database task"
---

# Relational Database Skill (PostgreSQL / MySQL / SQLite / ORM)

## When to Use

Load this skill whenever `database.primary` or `database.localOffline` in `project-config.json` is a relational database (PostgreSQL, MySQL, SQLite, SQLCipher, Supabase, PlanetScale, Cloud SQL, RDS) and you are:
- Designing or reviewing `specs/{feature}/schema.yml` (`tables` and `modifications` sections)
- Writing ORM schemas (`Drizzle`, `Prisma`, `SQLAlchemy`, `TypeORM`) and SQL migrations
- Implementing per-user or multi-tenant Row-Level Security (`ENABLE` / `FORCE ROW LEVEL SECURITY`)
- Defining `CHECK` constraints, `GENERATED ALWAYS AS (...) STORED` columns, or partial indexes
- Implementing database triggers (`updated_at`, audit trails, or append-only / WORM immutability locks)
- Writing database invariant integration tests (`db_integration_tests` in `test.yml`)

## Procedure

### 1. Schema Design (`specs/{feature}/schema.yml`)
1. Read `project-config.json` → `database.primary`, `database.localOffline`, `database.orm`, `database.dataPattern`.
2. Populate the `tables:` section of `schema.yml`:
   - Specify `schema` (e.g., `public` or isolated domain schema).
   - Define `columns` with exact `sql_type`, `required`, `references` (`ON DELETE CASCADE | RESTRICT`), `check_constraint_sql`, and `generated_always_sql`.
   - If `database.dataPattern` requires per-user or per-tenant isolation on PostgreSQL, set `rls_enabled: true`, `rls_forced: true`, and write the exact `rls_policy_sql`.
   - Declare all query-supporting `indexes` (including `where_clause` for partial indexes).
   - Declare any required `triggers_sql` (e.g., immutability locks or audit triggers).

### 2. ORM + Raw SQL Migration Workflow
1. Define application-facing models in the configured `database.orm` (`Drizzle`, `Prisma`, `SQLAlchemy`).
2. Generate the baseline SQL migration from the ORM.
3. Append raw SQL DDL to the migration for database features the ORM cannot express natively:
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and `ALTER TABLE ... FORCE ROW LEVEL SECURITY;`
   - `CREATE POLICY ...`
   - `GENERATED ALWAYS AS (...) STORED` columns
   - `CREATE TRIGGER ... BEFORE UPDATE OR DELETE ...`
4. See [ORM & Migrations Reference](./references/orm-and-migrations.md) for patterns.

### 3. Enforcing Row-Level Security & Immutability
1. Always set the tenant/user context inside a transaction (`SET LOCAL app.current_user_id = ...`) so connection pooling cannot leak session state across requests.
2. When a spec requires immutable or sealed records, attach a `BEFORE UPDATE OR DELETE` trigger that raises an exception when the lock column is `TRUE`.
3. See [PostgreSQL RLS, Constraints & Triggers Reference](./references/postgres-rls-and-triggers.md) for production-ready templates.

### 4. Testing Database Invariants (`db_integration_tests`)
1. Never mock the database when testing RLS policies, `CHECK` constraints, `GENERATED ALWAYS` columns, or triggers.
2. Run migrations against the configured `testing.dbIntegrationEngine` (e.g., in-memory `@electric-sql/pglite`, in-memory SQLite, or Testcontainers) and execute positive and negative assertions.

## References

- [PostgreSQL RLS, Constraints & Triggers](./references/postgres-rls-and-triggers.md)
- [ORM & Hybrid SQL Migrations](./references/orm-and-migrations.md)

