# Authentication System Guide

## Overview

The Rainbows App now uses **Supabase Auth** instead of NextAuth + MongoDB. This provides:
- Secure session management with HTTP-only cookies
- Role-based access control (RBAC)
- Permission-based UI rendering
- Multi-tenant isolation

---

## Authentication Flow

### 1. Sign Up / Onboarding

**New Church Registration**:
```
URL: /onboarding
Public: Yes (anyone can create a church)

Flow:
1. User fills in church information
2. User creates first admin account
3. System creates:
   - Church record
   - Admin user in Supabase Auth
   - User profile with church_admin role
4. Auto sign-in and redirect to dashboard
```

### 2. Sign In

**Existing User Login**:
```
URL: /auth/signin
Public: Yes

Flow:
1. User enters email and password
2. POST /api/auth/signin
3. Supabase Auth validates credentials
4. Session cookies set (sb-access-token, sb-refresh-token)
5. Redirect to dashboard
```

**Implementation**:
```typescript
// Client-side (src/app/auth/signin/page.tsx)
const response = await fetch("/api/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

if (response.ok) {
  router.push("/");
  router.refresh();
}
```

### 3. Session Management

**How Sessions Work**:
1. Session stored in HTTP-only cookies (XSS protection)
2. Cookies include:
   - `sb-access-token` (7 days)
   - `sb-refresh-token` (30 days)
3. Every API call checks session via `auth-helpers.ts`

**Get Current Session**:
```typescript
// Server-side
import { getSession } from '@/lib/auth-helpers';

const session = await getSession();
// Returns: { user: { id, email, name, role, permissions, church }, accessToken, refreshToken }
```

**Client-side Session Check**:
```typescript
// In components
const response = await fetch("/api/auth/session");
const { session } = await response.json();

if (session) {
  // User is signed in
  // Access: session.user.email, session.user.role, session.user.permissions
}
```

### 4. Sign Out

**Sign Out Process**:
```
Button: Sidebar → "Sign Out"

Flow:
1. POST /api/auth/signout
2. Cookies cleared
3. Supabase session revoked
4. Redirect to /auth/signin
```

**Implementation**:
```typescript
// Client-side (src/components/Sidebar.tsx)
await fetch("/api/auth/signout", {
  method: "POST",
});
router.push("/auth/signin");
router.refresh();
```

---

## Authorization (RBAC)

### Roles

**Church Admin** (`church_admin`):
- Full access to everything
- Can manage church settings
- Can add/remove users and classes
- All permissions enabled

**Admin** (`admin`):
- Can manage users (add teachers)
- Can manage classes
- Can do everything teachers can do
- Default permissions: all enabled

**Teacher** (`teacher`):
- Can manage students in their classes
- Can take attendance
- Can create and grade tests
- Cannot manage users or classes

### Permissions

Six permission types:
```typescript
{
  canManageUsers: boolean;      // Add/edit/delete users
  canManageClasses: boolean;    // Create/edit classes
  canEditStudents: boolean;     // CRUD student records
  canTakeAttendance: boolean;   // Record attendance
  canManageTests: boolean;      // Create and grade tests
  canViewReports: boolean;      // View analytics
}
```

### Permission Checks

**Server-side (API Routes)**:
```typescript
import { requireAuth, hasPermission, requireRole } from '@/lib/auth-helpers';

// Require authentication
export async function GET() {
  await requireAuth(); // Throws if not authenticated

  // Your code...
}

// Require specific permission
export async function POST() {
  const canManage = await hasPermission('canManageUsers');

  if (!canManage) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Your code...
}

// Require specific role
export async function PUT() {
  await requireRole('church_admin'); // Throws if not church_admin

  // Your code...
}
```

**Client-side (UI Components)**:
```typescript
// Fetch session
const [session, setSession] = useState(null);

useEffect(() => {
  fetch("/api/auth/session")
    .then(res => res.json())
    .then(data => setSession(data.session));
}, []);

// Conditional rendering
{session?.user?.permissions?.canManageUsers && (
  <Link href="/admin/users">Users</Link>
)}

{session?.user?.role === 'church_admin' && (
  <button>Church Settings</button>
)}
```

---

## API Endpoints

### Authentication

**POST /api/auth/signin**
```json
Request:
{
  "email": "admin@church.org",
  "password": "password123"
}

Response (200):
{
  "user": { "id": "...", "email": "..." },
  "message": "Signed in successfully"
}

Response (401):
{
  "error": "Invalid credentials"
}
```

**POST /api/auth/signout**
```json
Response (200):
{
  "message": "Signed out successfully"
}
```

**GET /api/auth/session**
```json
Response (200):
{
  "session": {
    "user": {
      "id": "uuid",
      "email": "admin@church.org",
      "name": "John Admin",
      "role": "church_admin",
      "permissions": { ... },
      "church": {
        "id": "uuid",
        "name": "First Rainbow Church"
      }
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}

Response (401):
{
  "error": "Not authenticated"
}
```

### Onboarding

**POST /api/onboarding**
```json
Request:
{
  "churchName": "First Rainbow Church",
  "churchEmail": "contact@church.org",
  "churchPhone": "(555) 123-4567",
  "churchAddress": "123 Main St",
  "adminName": "John Admin",
  "adminEmail": "john@church.org",
  "adminPassword": "password123"
}

Response (201):
{
  "church": { ... },
  "user": { ... },
  "session": { ... },
  "message": "Church onboarding completed successfully"
}
```

---

## UI Components

### Sidebar Navigation

The sidebar (`src/components/Sidebar.tsx`) now:
1. Fetches session on mount
2. Shows/hides admin links based on permissions
3. Updates sign-out to use new API

**Admin Section** (only visible if user has permissions):
```
Administration
  └─ Classes (if canManageClasses)
  └─ Users (if canManageUsers)
```

### Sign-In Page

Located at: `src/app/auth/signin/page.tsx`

Features:
- Email/password form
- Error handling
- Link to onboarding for new churches
- Uses `/api/auth/signin` endpoint

---

## Security Features

### HTTP-Only Cookies
- Cookies not accessible via JavaScript
- Protects against XSS attacks
- Secure flag in production

### Session Validation
- Every API call validates session
- Expired tokens rejected
- Automatic refresh token handling

### Multi-Tenant Isolation
- Row-Level Security (RLS) policies
- Each church only sees their data
- Database-level isolation

### Permission Checks
- Server-side validation on all APIs
- Client-side UI rendering based on permissions
- Role hierarchy enforced

---

## Testing the Auth System

### 1. Test Onboarding

```bash
# Navigate to onboarding
http://localhost:3000/onboarding

# Fill in form:
Church Name: Test Church
Church Email: test@church.org
Admin Name: Test Admin
Admin Email: admin@test.org
Admin Password: password123

# Should auto sign-in and redirect to dashboard
```

### 2. Test Sign In

```bash
# Sign out if logged in
# Navigate to sign in
http://localhost:3000/auth/signin

# Use credentials from onboarding:
Email: admin@test.org
Password: password123

# Should redirect to dashboard
```

### 3. Test Permissions

```bash
# As church_admin, check sidebar shows:
- Classes link (Administration section)
- Users link (Administration section)

# Navigate to /admin/users
# Should see user management interface

# Navigate to /admin/classes
# Should see class management interface
```

### 4. Test Sign Out

```bash
# Click "Sign Out" in sidebar
# Should redirect to /auth/signin
# Cookies should be cleared
# Navigating to / should show error or redirect
```

### 5. Test Multi-Tenant

```bash
# Complete onboarding for 2nd church
# Sign in as church 1 admin
# Verify you only see church 1 data

# Sign out and sign in as church 2 admin
# Verify you only see church 2 data
```

---

## Troubleshooting

### "Not authenticated" Error

**Check**:
1. Are cookies being set?
   - Browser Dev Tools → Application → Cookies
   - Look for `sb-access-token` and `sb-refresh-token`

2. Is session endpoint working?
   - Navigate to: http://localhost:3000/api/auth/session
   - Should return session object or 401

3. Are environment variables set?
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Can't Sign In

**Check**:
1. Is email/password correct?
2. Was user created in Supabase Auth?
   - Check Supabase Dashboard → Authentication → Users
3. Does user profile exist in users table?
   - Check Supabase Dashboard → Table Editor → users

### Admin Links Not Showing

**Check**:
1. Is session loading?
   - Check browser console for errors
2. Does user have correct permissions?
   - Check users table → permissions column
3. Is role correct?
   - Check users table → role column

### API Returns 403 Forbidden

**Check**:
1. User has required permission
2. API route is checking correct permission
3. Session is valid and not expired

---

## Migration Checklist

- [x] Replace NextAuth with Supabase Auth
- [x] Update sign-in page
- [x] Update sign-out functionality
- [x] Add session management
- [x] Create auth helper functions
- [x] Update sidebar with permission-based navigation
- [ ] Update all API routes to use auth-helpers
- [ ] Add auth checks to protected pages
- [ ] Test complete auth flow
- [ ] Test permission restrictions
- [ ] Test multi-tenant isolation

---

## Next Steps

1. **Update Remaining API Routes**
   - Replace `getTempChurchId()` with `getCurrentChurchId()`
   - Add `requireAuth()` calls
   - Use `hasPermission()` for permission checks

2. **Add Auth Checks to Pages**
   - Redirect to sign-in if not authenticated
   - Show permission denied for insufficient permissions

3. **Add User Profile Page**
   - View current user info
   - Change password
   - Update profile

4. **Add Email Verification**
   - Enable in Supabase dashboard
   - Send verification emails
   - Handle email confirmation flow

5. **Add Password Reset**
   - Forgot password link
   - Email reset link
   - Reset password page

---

## Support

For issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify environment variables
4. Test with fresh browser session (incognito)
5. Check this documentation

**Key Files**:
- `src/lib/auth-helpers.ts` - Auth utility functions
- `src/app/api/auth/*/route.ts` - Auth endpoints
- `src/app/auth/signin/page.tsx` - Sign-in UI
- `src/app/onboarding/page.tsx` - Onboarding UI
- `src/components/Sidebar.tsx` - Navigation with permissions
