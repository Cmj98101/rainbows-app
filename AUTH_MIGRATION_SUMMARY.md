# Authentication Migration Summary

## Problem

The dashboard (and other pages) were failing with authentication errors because the app was partially migrated from NextAuth to Supabase Auth, but some pages were still using NextAuth's `getServerSession()`.

## Root Cause

When we migrated to Supabase Auth:
- Created new auth API routes (`/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`)
- Created `auth-helpers.ts` with Supabase Auth functions
- Updated API routes to use `requireAuth()` and `getCurrentChurchId()`

**BUT** we forgot to update the **page components** that were still using:
```typescript
import { getServerSession } from "next-auth";
const session = await getServerSession();
```

This caused errors because:
1. NextAuth is no longer configured or running
2. The session would always be `null`
3. Server-side fetch calls to API routes weren't passing authentication cookies

## Changes Made

### 1. Updated Dashboard Page (`src/app/page.tsx`)

**Before:**
```typescript
import { getServerSession } from "next-auth";

const session = await getServerSession();
if (!session) {
  redirect("/auth/signin");
}

const response = await fetch(`${baseUrl}/api/dashboard`, {
  cache: 'no-store',
});
```

**After:**
```typescript
import { cookies } from "next/headers";

const cookieStore = await cookies();
const accessToken = cookieStore.get('sb-access-token')?.value;
if (!accessToken) {
  redirect("/auth/signin");
}

const response = await fetch(`${baseUrl}/api/dashboard`, {
  cache: 'no-store',
  headers: {
    Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
  },
});
```

### 2. Updated Students Page (`src/app/students/page.tsx`)

Same pattern as dashboard - removed NextAuth, added Supabase cookie auth.

### 3. Updated Tests Page (`src/app/tests/page.tsx`)

Same pattern as dashboard - removed NextAuth, added Supabase cookie auth.

## Key Concepts

### Server-Side Authentication in Next.js 15

When using server components in Next.js 15:

1. **Check authentication** by reading cookies:
   ```typescript
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('sb-access-token')?.value;
   ```

2. **Pass cookies to API routes** when making fetch calls:
   ```typescript
   headers: {
     Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
   }
   ```

3. **API routes use auth-helpers** which also read from cookies:
   ```typescript
   await requireAuth(); // Throws if not authenticated
   const churchId = await getCurrentChurchId();
   ```

### Why Pass Cookies Explicitly?

In Next.js, when a server component makes a `fetch()` call to an API route (even on the same server), cookies are NOT automatically forwarded. You must explicitly pass them in the `Cookie` header.

This is different from client-side fetch, where cookies are automatically included.

## Authentication Flow

### Sign In
1. User submits credentials to `/api/auth/signin`
2. Supabase validates and returns tokens
3. Tokens stored as HTTP-only cookies: `sb-access-token`, `sb-refresh-token`
4. User redirected to dashboard

### Accessing Protected Pages
1. Server component reads `sb-access-token` from cookies
2. If missing, redirect to `/auth/signin`
3. If present, make API calls with cookies in headers
4. API routes use `requireAuth()` to validate token

### API Route Authentication
1. `requireAuth()` reads cookies via `getSession()`
2. `getSession()` validates token with Supabase
3. If invalid, throws authentication error (401)
4. If valid, returns user session with profile

## Files Modified

1. **`src/app/page.tsx`** - Dashboard page auth
2. **`src/app/students/page.tsx`** - Students page auth
3. **`src/app/tests/page.tsx`** - Tests page auth

## Files No Longer Needed (Can Be Deleted)

These files are from the old NextAuth system and are no longer used:

- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- Any NextAuth-related environment variables in `.env.local`

## Environment Variables

Make sure you have:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Remove any NextAuth variables:
- ❌ `NEXTAUTH_SECRET`
- ❌ `NEXTAUTH_URL`
- ❌ `MONGODB_URI` (if only used for NextAuth)

## Testing Checklist

After migration, test:

- ✅ Sign in at `/auth/signin`
- ✅ Dashboard loads without errors
- ✅ Students page loads
- ✅ Tests page loads
- ✅ Sign out works
- ✅ Accessing protected pages without auth redirects to sign-in
- ✅ API routes reject unauthenticated requests

## Common Issues

### "Failed to fetch dashboard data"

**Cause**: Server component not passing cookies to API route

**Solution**: Add Cookie header to fetch:
```typescript
headers: {
  Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
}
```

### Infinite redirect loop

**Cause**: Session check failing, constantly redirecting

**Solution**:
1. Check cookies are being set after sign-in
2. Verify `sb-access-token` exists in browser DevTools → Application → Cookies
3. Check API route is correctly validating the token

### 401 Unauthorized on API routes

**Cause**: Token not being passed or is invalid

**Solution**:
1. Check cookies are being passed in fetch headers
2. Verify token hasn't expired
3. Check Supabase Auth is properly configured

## Next Steps

1. ✅ All page components migrated to Supabase Auth
2. ✅ All API routes use `requireAuth()`
3. ⏭️ Delete old NextAuth files (optional cleanup)
4. ⏭️ Test complete authentication flow
5. ⏭️ Apply RLS policies in Supabase (see `supabase-rls-policies.sql`)

## Related Documentation

- `AUTHENTICATION_GUIDE.md` - Complete auth system documentation
- `ADMIN_SYSTEM_SETUP.md` - Admin and user management
- `TEACHER_PERMISSIONS_GUIDE.md` - Teacher role restrictions
- `supabase-rls-policies.sql` - Database security policies
