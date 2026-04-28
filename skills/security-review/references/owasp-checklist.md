# OWASP Top 10 Checklist — Generic

Customize this checklist for your project's tech stack after running `/onboard`.

## A01: Broken Access Control

- [ ] All protected API routes validate session/auth before processing
- [ ] Database queries scope data to the authenticated user
- [ ] No direct object reference without ownership check
- [ ] Middleware/guards validate auth on all protected routes
- [ ] Admin routes have role-based access control

## A02: Cryptographic Failures

- [ ] Session cookies/tokens: `httpOnly`, `secure`, `SameSite` flags
- [ ] No secrets in public/client-side environment variables
- [ ] Server credentials never sent to client
- [ ] API keys not logged or included in error responses
- [ ] Passwords hashed with bcrypt/argon2 (if applicable)

## A03: Injection

- [ ] No string concatenation in database queries (use parameterized queries/ORM)
- [ ] All user input validated at API route boundary
- [ ] JSON.parse / deserialization wrapped in try/catch on untrusted data
- [ ] No `eval()`, `new Function()`, or `innerHTML` with user data
- [ ] No raw SQL — use ORM or parameterized queries

## A04: Insecure Design

- [ ] Rate limiting on authentication endpoints
- [ ] Failed login attempts don't reveal user existence
- [ ] Password reset tokens are single-use with short expiry
- [ ] File uploads validated (type, size, content)

## A05: Security Misconfiguration

- [ ] CORS headers restrict to allowed origins
- [ ] Error responses return generic messages (no stack traces)
- [ ] Debug endpoints not accessible in production
- [ ] Security headers set (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] Default credentials changed

## A06: Vulnerable Components

- [ ] `npm audit` / `pip-audit` reports no critical/high vulnerabilities
- [ ] Dependencies regularly updated
- [ ] No unnecessary packages in dependency manifest
- [ ] Lock files committed to version control

## A07: Authentication Failures

- [ ] Auth mechanism is industry-standard (OAuth, OIDC, etc.)
- [ ] Session tokens expire within reasonable time
- [ ] Logout properly invalidates session
- [ ] Token refresh handled securely (server-side preferred)
- [ ] Multi-factor authentication available (if applicable)

### OAuth / Social Login Specific

- [ ] OAuth state parameter used to prevent CSRF during login
- [ ] Authorization code exchanged server-side (not in client)
- [ ] OAuth tokens stored server-side, never exposed to client
- [ ] Provider callback URLs validated against allowlist
- [ ] Email from OAuth provider verified before account linking
- [ ] Account linking requires explicit user action (no silent merge)
- [ ] Phone-only auth validates phone format and country code
- [ ] Apple relay emails handled (privaterelay.appleid.com)
- [ ] OAuth scopes requested are minimum necessary
- [ ] Token revocation on logout/account deletion calls provider revoke endpoint

### Mock Auth Safety (Testing)

- [ ] Mock auth ONLY activates when `MOCK_AUTH_ENABLED=true` AND `NODE_ENV !== 'production'`
- [ ] Mock user data uses `@mock.test` domain — never real domains
- [ ] Mock tokens prefixed with `mock_` to distinguish from real tokens
- [ ] Production builds exclude/tree-shake mock auth modules
- [ ] CI pipeline validates no mock auth code in production bundle

## A08: Data Integrity Failures

- [ ] API route input validated with type checks / schemas
- [ ] Database rules/constraints validate document/row shape
- [ ] No unvalidated redirects or forwards
- [ ] CI/CD pipeline integrity (signed commits, protected branches)

## A09: Logging Failures

- [ ] Errors logged server-side without sensitive data
- [ ] Authentication failures logged
- [ ] No PII in client-side console.log
- [ ] Audit trail for sensitive operations

## A10: SSRF

- [ ] External API calls use hardcoded/allowlisted base URLs
- [ ] No user-controlled URLs in server-side fetch/requests
- [ ] Proxy routes validate target before forwarding
- [ ] Internal services not accessible from user input
