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
