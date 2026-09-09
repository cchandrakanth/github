---
description: "Use when creating or modifying API routes. Covers session validation, error handling, and response patterns. Adapts to the backend framework in project-config.json."
applyTo: "**/api/**/*.{ts,js,py,go,rs}"
---

# API Route Standards

> Read `project-config.json` for: `techStack.backend`, `techStack.language`, `auth.provider`, `auth.sessionMechanism`, `database.primary`.
> Adapt all patterns and code examples below to match the configured backend framework and language.

## Required Pattern

Every protected API route must:

1. Validate the session/auth token before any logic
2. Return appropriate HTTP status codes
3. Handle errors at the boundary with try/catch
4. Never expose internal details in error responses

## Example (TypeScript)

```typescript
export async function GET(request: Request) {
  // 1. Auth check
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Route logic
    const data = await fetchData(session.uid);
    return Response.json(data);
  } catch (error) {
    // 3. Boundary error handling
    console.error("GET /api/resource failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Rules

- Always verify session/auth first on protected routes
- Return proper HTTP status codes: 400 (bad input), 401 (no auth), 403 (forbidden), 404 (not found), 500 (server error)
- Wrap handler body in try/catch, return 500 on unexpected errors
- Never expose stack traces or internal details in error responses
- Validate all request body fields at the boundary
- Access database with authenticated user's ID only

## API Contract (OpenAPI / Swagger)

**The contract is part of the spec, not documentation written afterwards.** A route's OpenAPI operation is authored or updated *before* the handler code, in the same PR, and reviewed alongside the spec's acceptance criteria. A route whose contract landed after the fact is a spec violation.

### Where it lives

| File | Purpose |
|------|---------|
| `openapi.yaml` (repo root) | Single source of truth — one servable document |
| `specs/{feature}/schema.yml` → `api_routes` | Per-feature index: which operations this spec adds or changes, by `operation_id` |

Keep one document rather than per-feature fragments — mock servers, Swagger UI, and client codegen all want a single file, and merging fragments needs tooling you don't otherwise need. If it outgrows one file, split with `$ref` into `openapi/paths/*.yaml` and `openapi/components/schemas/*.yaml`; the root file stays the entry point.

### Every operation must declare

```yaml
paths:
  /api/invoices/{invoiceId}:
    get:
      operationId: getInvoice          # stable, unique — tests and codegen key off this
      summary: Fetch a single invoice
      tags: [Invoices]
      security:
        - bearerAuth: []               # omit ONLY for genuinely public routes
      parameters:
        - name: invoiceId
          in: path
          required: true
          schema: { type: string, pattern: '^INV-[0-9]{4}$' }
      responses:
        '200':
          description: The invoice
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Invoice' }
              examples:
                default:
                  value: { id: 'INV-1042', total: 4200, status: 'paid' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '500': { $ref: '#/components/responses/InternalError' }
```

Rules for authoring:

- **Document every status code the handler can return.** The Rules section above mandates 400/401/403/404/500 — each one the route can emit needs a response entry. An undocumented status is a contract bug, and it's what makes generated clients throw on valid responses.
- **Define the error envelope once** in `components/responses` and `$ref` it everywhere, so error shape can't drift per route.
- **Reuse `components/schemas`.** An inline response schema duplicated across three operations will diverge within a month.
- **Give at least one `example` per response.** Examples are what the mock server serves — a contract with no examples mocks as empty objects and is useless for frontend work.
- **`operationId` is a stable identifier.** Renaming one is a breaking change for generated clients; treat it like renaming a public function.
- **Mark auth explicitly.** A missing `security` block reads as "public route" to every consumer and every scanner.

### Validate before commit

```bash
npx @redocly/cli lint openapi.yaml              # spec validity + style rules
npx @stoplight/spectral-cli lint openapi.yaml   # custom org rulesets, if configured
```

Wire whichever you pick into CI — an invalid contract should fail the build, not surface when someone generates a client.

## Spinning the Contract Up on the Side

The point of a contract is that it runs. Two independent servers, both fed from `openapi.yaml`:

### 1. Mock server (Prism) — a working API before the backend exists

```bash
npx @stoplight/prism-cli mock openapi.yaml --port 4010
npx @stoplight/prism-cli mock openapi.yaml --port 4010 --dynamic   # generated data, not fixed examples
```

Serves every documented operation on `localhost:4010`, returning the `examples` from the contract and rejecting requests that violate it. This unblocks frontend and test authoring while the real handlers are still being written, and it means an undocumented field is a *failure* rather than something that quietly works.

Request a non-default response with the `Prefer` header:

```bash
curl -H 'Prefer: code=404' http://localhost:4010/api/invoices/INV-9999
curl -H 'Prefer: example=empty' http://localhost:4010/api/invoices
```

### 2. Proxy mode — validate the real implementation against the contract

```bash
npx @stoplight/prism-cli proxy openapi.yaml http://localhost:3000 --errors
```

Requests pass through to the real server and Prism flags every deviation — undocumented field, wrong type, missing status code. `--errors` makes violations fail the response instead of only logging. Point your e2e suite at the proxy port to catch drift automatically.

### 3. Swagger UI — browsable docs while developing

```bash
docker run --rm -p 8080:8080 \
  -e SWAGGER_JSON=/spec/openapi.yaml \
  -v "$(pwd):/spec" swaggerapi/swagger-ui
```

Or `npx @redocly/cli preview-docs openapi.yaml` for a Redoc-style preview with no Docker.

### Wire it into the project

```jsonc
// package.json
{
  "scripts": {
    "api:lint":  "redocly lint openapi.yaml",
    "api:mock":  "prism mock openapi.yaml --port 4010",
    "api:proxy": "prism proxy openapi.yaml http://localhost:3000 --errors",
    "api:docs":  "redocly preview-docs openapi.yaml"
  }
}
```

Playwright can start the mock automatically for contract-driven e2e runs — `webServer` accepts an array:

```typescript
// playwright.config.ts
webServer: [
  { command: 'npm run dev',      url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
  { command: 'npm run api:mock', url: 'http://localhost:4010', reuseExistingServer: !process.env.CI },
],
```

Then point the app at `http://localhost:4010` via env var for suites that should run against the contract rather than a live backend.

### Assert responses against the contract in tests

```typescript
import jestOpenAPI from 'jest-openapi';
jestOpenAPI(path.join(__dirname, '../openapi.yaml'));

it('AC-04: GET /api/invoices/:id matches the contract', async () => {
  const response = await request(app).get('/api/invoices/INV-1042');
  expect(response.status).toBe(200);
  expect(response).toSatisfyApiSpec();   // fails on any undocumented shape
});
```

For broader coverage, `schemathesis run openapi.yaml --base-url=http://localhost:3000` generates property-based cases from the contract and finds edge cases hand-written tests miss.

## Keeping Contract and Code in Sync

Drift is the failure mode that makes contracts worthless. Three defences, cheapest first:

1. **Contract-first ordering** — update `openapi.yaml`, then the handler. Reviewers check the contract diff against the spec's ACs.
2. **Response validation in tests** — `toSatisfyApiSpec()` or Prism proxy in CI, so an undocumented field fails a test rather than shipping.
3. **Breaking-change detection** on every PR:

```bash
oasdiff breaking origin/dev:openapi.yaml openapi.yaml
```

Removing an operation or response, tightening a type, adding a required request field, or renaming an `operationId` are all breaking. If one is intentional, version the path (`/api/v2/...`) and keep the old operation until consumers migrate — don't mutate a published operation in place.

Record the contract change in the spec's `## Change Log`, and link the spec from the operation's `description` when the operation encodes non-obvious business rules.
