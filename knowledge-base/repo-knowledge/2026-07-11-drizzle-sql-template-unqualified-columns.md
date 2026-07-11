---
title: "Drizzle sql`` templates render column refs unqualified — correlated subqueries silently wrong"
date: 2026-07-11
type: integration-quirk
tags: [drizzle, sqlite, sql-template, correlated-subquery, silent-bug]
related_specs: ["specs/folders-tags/spec.md"]
related_issues: ["#3"]
---

# Drizzle sql`` templates render column refs unqualified — correlated subqueries silently wrong

## Context

`foldersRepo.listFoldersWithCounts()` computes per-folder live note counts with a correlated subquery inside a `sql` template.

## Knowledge / Decision

Interpolating drizzle column objects inside a `sql` template emits them **unqualified**: `${folders.id}` renders as `"id"`, not `"folders"."id"`. Inside a subquery whose FROM is `notes`, the outer-table reference silently resolves against `notes` (`where "folder_id" = "id"` compared notes.folder_id to notes.id), returning wrong results with **no error**. Verified with `.toSQL()`.

## Consequences / How to apply

In any raw `sql` fragment that must reference a table from an outer scope, write the qualified identifiers as plain text (`folders.id`, `n.folder_id`), aliasing the inner table:

```ts
sql<number>`(select count(*) from notes n where n.folder_id = folders.id and n.deleted_at is null)`
```

When a drizzle query returns suspicious results, print `query.toSQL()` before debugging anything else.

## Links

- src/db/repositories/foldersRepo.ts (listFoldersWithCounts)
