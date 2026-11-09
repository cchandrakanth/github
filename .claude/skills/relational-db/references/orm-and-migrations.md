# ORM & Hybrid SQL Migrations Reference

## 1. Drizzle ORM + Custom SQL Migrations

Define tables, indexes, and basic `CHECK` constraints in Drizzle, and pair with custom SQL migrations (`drizzle-kit generate --custom`) for RLS policies and PL/pgSQL triggers:

```typescript
import { pgSchema, uuid, varchar, boolean, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const appSchema = pgSchema('app_schema');

export const records = appSchema.table(
  'records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    title: varchar('title', { length: 128 }).notNull(),
    isSealed: boolean('is_sealed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_records_user_created').on(table.userId, table.createdAt),
    check('chk_title_nonempty', sql`char_length(${table.title}) > 0`),
  ]
);
```

## 2. Prisma + Custom SQL Migrations

When using Prisma (`database.orm` = Prisma):
1. Generate the draft migration without applying:
   ```bash
   npx prisma migrate dev --create-only --name add_rls_and_triggers
   ```
2. Append `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, `CREATE POLICY`, and `CREATE TRIGGER` statements to the generated `migration.sql`.
3. Apply the migration:
   ```bash
   npx prisma migrate dev
   ```

## 3. Local / Offline Encrypted SQLite (`SQLCipher` / `WatermelonDB`)

When `database.localOffline` is configured in `project-config.json`:
- Initialize the local database with an encryption key derived from platform secure storage (Keychain / Keystore / OS Credential Manager).
- Keep local schema migrations versioned and deterministic.
- Never store raw encryption keys in `localStorage`, `.env`, or source files.

