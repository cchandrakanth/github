# PostgreSQL Row-Level Security (RLS), Constraints & Triggers Reference

## 1. Per-User / Multi-Tenant Row-Level Security (RLS)

Always enable **and force** RLS on tenant-scoped tables so even the table owner role cannot bypass policies unless explicitly granted `BYPASSRLS`.

```sql
ALTER TABLE app_schema.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_schema.items FORCE ROW LEVEL SECURITY;

CREATE POLICY items_tenant_isolation ON app_schema.items
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID)
  WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID);
```

### Setting Session Context Safely in Connection Pools

Never use session-wide `SET app.current_user_id` with pooled connections (PgBouncer / Cloud SQL / Neon). Always wrap queries in a transaction and use `SET LOCAL` (or `set_config(..., true)`):

```typescript
export async function withUserContext<T>(
  db: Database,
  userId: string,
  fn: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    return fn(tx);
  });
}
```

## 2. Declarative `CHECK` Constraints & `GENERATED ALWAYS` Columns

Enforce domain invariants and deterministic calculations directly in the table definition:

```sql
CREATE TABLE app_schema.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  tax_cents INTEGER NOT NULL CHECK (tax_cents >= 0),
  total_cents INTEGER GENERATED ALWAYS AS (subtotal_cents + tax_cents) STORED,
  external_sync_allowed BOOLEAN NOT NULL DEFAULT FALSE CHECK (external_sync_allowed = FALSE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 3. Immutability / WORM & Audit Triggers

When a spec requires append-only audit logs or sealed/locked records that cannot be mutated or deleted once finalized:

```sql
CREATE OR REPLACE FUNCTION app_schema.fn_enforce_immutable_record()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_sealed = TRUE THEN
    RAISE EXCEPTION 'IMMUTABLE_RECORD_VIOLATION: Record % is sealed and cannot be modified or deleted', OLD.id
      USING ERRCODE = '55000';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_immutable_record
  BEFORE UPDATE OR DELETE ON app_schema.records
  FOR EACH ROW
  EXECUTE FUNCTION app_schema.fn_enforce_immutable_record();
```

## 4. Testing RLS & Triggers with PGlite (`@electric-sql/pglite`)

Run fast, zero-Docker PostgreSQL invariant tests in Vitest/Jest using `@electric-sql/pglite`:

```typescript
import { PGlite } from '@electric-sql/pglite';
import { describe, it, expect, beforeAll } from 'vitest';

describe('PostgreSQL RLS & Immutability Triggers', () => {
  let pg: PGlite;

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(migrationSql);
    await pg.exec(`CREATE ROLE app_user LOGIN; GRANT USAGE ON SCHEMA app_schema TO app_user; GRANT ALL ON ALL TABLES IN SCHEMA app_schema TO app_user;`);
  });

  it('enforces cross-user RLS isolation', async () => {
    await pg.exec(`
      BEGIN;
      SET LOCAL ROLE app_user;
      SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000001', true);
      INSERT INTO app_schema.items (user_id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Secret');
      COMMIT;
    `);

    const res = await pg.exec(`
      BEGIN;
      SET LOCAL ROLE app_user;
      SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000002', true);
      SELECT * FROM app_schema.items;
      COMMIT;
    `);
    expect(res[3].rows).toHaveLength(0);
  });
});
```

