# Mock Users & Roles Fixture Reference

Use these mock users when `MOCK_AUTH_ENABLED=true` is set in `.env`. This fixture provides 50 users across 10 roles and 6 OAuth providers for comprehensive multi-role testing.

## Environment Variable

```env
# .env or .env.test
MOCK_AUTH_ENABLED=true          # Enables mock auth — NEVER set in production
MOCK_AUTH_DEFAULT_USER=user-01  # Optional: default mock user ID for dev server
MOCK_AUTH_BYPASS_MFA=true       # Optional: skip MFA checks in test/dev
```

> **SECURITY**: The mock auth system must ONLY activate when `MOCK_AUTH_ENABLED=true` AND `NODE_ENV !== 'production'` (or equivalent). Production builds must strip mock code entirely.

## Roles

| Role | Permissions Summary |
|------|-------------------|
| `super-admin` | Full system access, manage all tenants/orgs |
| `admin` | Full org access, manage users, settings, billing |
| `billing-admin` | Manage billing, subscriptions, invoices only |
| `owner` | Full project/resource access within owned scope |
| `manager` | Manage team members, approve content, view reports |
| `moderator` | Moderate content, manage flags, suspend users |
| `editor` | Create and edit content, cannot publish or delete |
| `viewer` | Read-only access to permitted resources |
| `support` | Read access + ability to act on behalf of users |
| `guest` | Unauthenticated or limited public access |

## OAuth Providers

| Provider | `provider` value | ID format | Login identifier |
|----------|-----------------|-----------|-----------------|
| Google (Gmail) | `google` | Google UID | email |
| GitHub | `github` | GitHub numeric ID | username/email |
| Phone (SMS OTP) | `phone` | Phone number | phone |
| Apple | `apple` | Apple UID | email (may be relay) |
| Microsoft | `microsoft` | MS object ID | email |
| Facebook | `facebook` | FB numeric ID | email |

## Mock User Registry (50 Users)

### Super Admins (2)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-01` | Priya Sharma | priya.admin@mock.test | google | ✅ | ✅ | Primary super-admin |
| `user-02` | Marcus Chen | marcus.sa@mock.test | github | ✅ | ✅ | Secondary super-admin |

### Admins (5)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-03` | Elena Rodriguez | elena.admin@mock.test | google | ✅ | ✅ | Org A admin |
| `user-04` | James Okafor | james.admin@mock.test | microsoft | ✅ | ✅ | Org B admin |
| `user-05` | Aiko Tanaka | aiko.admin@mock.test | google | ❌ | ✅ | Admin without MFA |
| `user-06` | David Kim | +14155550106 | phone | ✅ | ✅ | Phone-only admin |
| `user-07` | Sarah Mitchell | sarah.admin@mock.test | apple | ✅ | ✅ | Apple relay email admin |

### Billing Admins (3)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-08` | Raj Patel | raj.billing@mock.test | google | ✅ | ✅ | Active billing plan |
| `user-09` | Lisa Wang | lisa.billing@mock.test | github | ❌ | ✅ | Trial plan user |
| `user-10` | Omar Hassan | omar.billing@mock.test | microsoft | ✅ | ✅ | Expired plan user |

### Owners (5)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-11` | Ana Costa | ana.owner@mock.test | google | ✅ | ✅ | Owns Project Alpha |
| `user-12` | Yusuf Ali | yusuf.owner@mock.test | github | ✅ | ✅ | Owns Project Beta |
| `user-13` | Emma Johnson | emma.owner@mock.test | apple | ❌ | ✅ | Owns Project Gamma |
| `user-14` | Wei Zhang | +8613800000014 | phone | ✅ | ✅ | Phone-only owner |
| `user-15` | Fatima Noor | fatima.owner@mock.test | facebook | ✅ | ✅ | Multi-project owner |

### Managers (6)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-16` | Carlos Mendez | carlos.mgr@mock.test | google | ✅ | ✅ | Team Alpha manager |
| `user-17` | Keiko Yamamoto | keiko.mgr@mock.test | github | ✅ | ✅ | Team Beta manager |
| `user-18` | Patrick O'Brien | patrick.mgr@mock.test | microsoft | ❌ | ✅ | Manager without MFA |
| `user-19` | Amara Diallo | +221770000019 | phone | ✅ | ✅ | Phone-only manager |
| `user-20` | Sophie Laurent | sophie.mgr@mock.test | apple | ✅ | ✅ | Cross-team manager |
| `user-21` | Ivan Petrov | ivan.mgr@mock.test | google | ✅ | ❌ | Unverified email manager |

### Moderators (4)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-22` | Zainab Osei | zainab.mod@mock.test | google | ✅ | ✅ | Content moderator |
| `user-23` | Lee Joon-ho | joonho.mod@mock.test | github | ❌ | ✅ | Community moderator |
| `user-24` | Maria Santos | maria.mod@mock.test | facebook | ✅ | ✅ | Multi-region moderator |
| `user-25` | Alex Rivera | +12125550125 | phone | ✅ | ✅ | Phone-only moderator |

### Editors (8)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-26` | Tom Williams | tom.editor@mock.test | google | ❌ | ✅ | Standard editor |
| `user-27` | Ling Zhao | ling.editor@mock.test | github | ✅ | ✅ | Editor with MFA |
| `user-28` | Nina Kowalski | nina.editor@mock.test | microsoft | ❌ | ✅ | MS-linked editor |
| `user-29` | Hassan Yilmaz | hassan.editor@mock.test | google | ❌ | ✅ | Multi-language content |
| `user-30` | Grace Adeyemi | grace.editor@mock.test | apple | ✅ | ✅ | Apple relay editor |
| `user-31` | Ravi Gupta | +919876500031 | phone | ❌ | ✅ | Phone-only editor |
| `user-32` | Julia Ferreira | julia.editor@mock.test | facebook | ❌ | ✅ | Social login editor |
| `user-33` | Ben Taylor | ben.editor@mock.test | github | ✅ | ❌ | Unverified editor |

### Viewers (8)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-34` | Mei Lin | mei.viewer@mock.test | google | ❌ | ✅ | Standard viewer |
| `user-35` | Abdul Rahman | abdul.viewer@mock.test | google | ❌ | ✅ | Minimal permissions |
| `user-36` | Chloe Martin | chloe.viewer@mock.test | apple | ❌ | ✅ | Apple relay viewer |
| `user-37` | Dmitri Volkov | dmitri.viewer@mock.test | microsoft | ❌ | ✅ | Enterprise SSO viewer |
| `user-38` | Nkechi Eze | nkechi.viewer@mock.test | github | ❌ | ✅ | GitHub viewer |
| `user-39` | Suki Tanabe | +818012340039 | phone | ❌ | ✅ | Phone-only viewer |
| `user-40` | Lucas Moreau | lucas.viewer@mock.test | facebook | ❌ | ✅ | Social login viewer |
| `user-41` | Ingrid Svensson | ingrid.viewer@mock.test | google | ✅ | ❌ | Unverified viewer |

### Support Agents (4)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-42` | Chris Brown | chris.support@mock.test | google | ✅ | ✅ | L1 support |
| `user-43` | Yuki Sato | yuki.support@mock.test | github | ✅ | ✅ | L2 support, can impersonate |
| `user-44` | Priscilla Owens | priscilla.support@mock.test | microsoft | ✅ | ✅ | L3 escalation support |
| `user-45` | Ahmed Mansour | +201000000045 | phone | ✅ | ✅ | Phone-only support |

### Guests / Unauthenticated (5)

| ID | Name | Email/Phone | Provider | MFA | Verified | Notes |
|----|------|-------------|----------|-----|----------|-------|
| `user-46` | Guest Visitor | — | `anonymous` | ❌ | ❌ | No auth, public access only |
| `user-47` | Pending Signup | pending@mock.test | google | ❌ | ❌ | Started OAuth, didn't complete |
| `user-48` | Expired Session | expired@mock.test | github | ❌ | ✅ | Token expired, needs re-auth |
| `user-49` | Banned User | banned@mock.test | google | ❌ | ✅ | Account suspended |
| `user-50` | Deleted Account | deleted@mock.test | apple | ❌ | ✅ | Soft-deleted, data retained |

## Mock User Object Shape

```typescript
interface MockUser {
  id: string;              // "user-01" through "user-50"
  name: string;
  email: string | null;    // null for phone-only users
  phone: string | null;    // null for email-only users
  role: Role;
  provider: OAuthProvider;
  providerId: string;      // Provider-specific UID
  avatar: string | null;
  verified: boolean;       // Email/phone verified
  mfaEnabled: boolean;
  status: 'active' | 'suspended' | 'deleted' | 'pending';
  orgId: string | null;    // Organization membership
  createdAt: string;       // ISO 8601
  lastLoginAt: string;     // ISO 8601
  metadata: Record<string, unknown>; // Provider-specific claims
}

type Role = 'super-admin' | 'admin' | 'billing-admin' | 'owner'
  | 'manager' | 'moderator' | 'editor' | 'viewer' | 'support' | 'guest';

type OAuthProvider = 'google' | 'github' | 'phone' | 'apple'
  | 'microsoft' | 'facebook' | 'anonymous';
```

## Helper Lookup Functions

```typescript
// These helpers should live in your test utils, e.g. __tests__/helpers/mock-auth.ts

/** Get a mock user by ID */
function getMockUser(id: string): MockUser;

/** Get all mock users with a specific role */
function getMockUsersByRole(role: Role): MockUser[];

/** Get all mock users for a specific provider */
function getMockUsersByProvider(provider: OAuthProvider): MockUser[];

/** Get a mock user with specific traits */
function getMockUserWhere(filter: Partial<MockUser>): MockUser | undefined;

/** Create a mock session from a mock user */
function createMockSession(userId: string): MockSession;

/** Create a mock OAuth token from a mock user */
function createMockOAuthToken(userId: string, provider: OAuthProvider): MockOAuthToken;
```

## Test Scenario Matrix

Use this matrix to ensure coverage across roles and providers:

| Scenario | Roles to Test | Providers to Test |
|----------|--------------|-------------------|
| Login flow | all | all 6 providers |
| Access protected resource | admin, editor, viewer, guest | google, github |
| Create content | editor, admin, owner | any 2+ providers |
| Delete content | admin, owner, moderator | any 2+ providers |
| Admin panel access | super-admin, admin | any 2+ providers |
| Billing operations | billing-admin, admin | any 2+ providers |
| User management | admin, super-admin, manager | google, github |
| Content moderation | moderator, admin | any 2+ providers |
| Impersonation | support (L2+), super-admin | any |
| Expired/banned/deleted | guest edge cases (user-48,49,50) | respective providers |
| MFA enforcement | users with mfa ✅ vs ❌ | any 2+ providers |
| Unverified email/phone | user-21, user-33, user-41, user-47 | respective providers |
| Phone-only auth | user-06,14,19,25,31,39,45 | phone |
| Cross-org access | users in different orgs | any |
