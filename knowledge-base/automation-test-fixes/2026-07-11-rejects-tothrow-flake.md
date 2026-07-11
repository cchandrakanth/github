---
title: "better-sqlite3 errors fail instanceof/rejects.toThrow across jest sandboxes"
date: 2026-07-11
fix_type: true-fix
tags: [jest, better-sqlite3, cross-realm, instanceof, rejects, flaky, parallel-workers]
test_files: ["__tests__/unit/db-migrations.test.ts"]
related_specs: ["specs/app-foundation/test.yml"]
related_issues: ["#1"]
---

# better-sqlite3 errors fail instanceof / rejects.toThrow across jest sandboxes

## Failure Mode

`database migrations › rolls back atomically when a migration fails (EC-2)` failed in ~30-40% of full-suite runs — never in isolation — first as:

```
expect(received).rejects.toThrow()
Received function did not throw
```

and after switching to try/catch, as the diagnostic:

```
expect(received).toBeInstanceOf(expected)
Expected constructor: Error
Received constructor: SqliteError
```

## Diagnosis

Cross-realm error identity. Jest gives every test file its own sandboxed globals (its own `Error`). better-sqlite3 is a **native** module: its `SqliteError` class is created once per worker process, in whichever test file's sandbox loads it first. When a different test file in the same worker later triggers an error, the thrown `SqliteError` extends the *first* sandbox's `Error`, so the current file's `instanceof Error` is false — and `expect().rejects.toThrow()` (which requires an Error-like) misreports "did not throw". Whether the file shares a worker with another better-sqlite3 suite depends on scheduling → intermittent. A 200-iteration try/catch repro in the same runs confirmed `runMigrations` rejects deterministically; only the assertion was wrong.

## Stabilization

Assert on error presence + message instead of class identity:

```ts
let error: unknown = null;
try { await runMigrations(executor, broken); } catch (e) { error = e; }
expect(error).not.toBeNull();
expect(String((error as Error).message)).toMatch(/syntax error/i);
```

## Pattern

In this repo, never assert `toBeInstanceOf(Error)` or `.rejects.toThrow()` on errors that originate from **better-sqlite3** (or any native module) — they may come from another jest sandbox's realm. Match on `error.message` / `error.name` instead. App-code errors (e.g. `DuplicateNameError` from src/lib/errors) are safe: they're constructed in the test file's own registry.

## Links

- specs/app-foundation/test.yml (migration tests)
