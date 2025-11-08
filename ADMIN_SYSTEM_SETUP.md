# Admin System Setup Guide

## What We Built

A complete multi-tenant admin system for managing churches, users, and permissions using Supabase Auth.

### ✅ Features Implemented

1. **Supabase Authentication**
   - Replaced NextAuth + MongoDB with Supabase Auth
   - Session management with HTTP-only cookies
   - Auth helper functions for permissions and roles

2. **Church Management**
   - API routes for creating and managing churches
   - Church onboarding flow for new organizations
   - Multi-tenant data isolation

3. **User Management**
   - Three role types: `church_admin`, `admin`, `teacher`
   - Fine-grained permission system
   - User CRUD operations (create, read, update, delete)
   - Admin dashboard for managing users

4. **Role-Based Access Control**
   - `church_admin`: Full access to everything
   - `admin`: Can manage users, classes, students
   - `teacher`: Can manage students, attendance, tests

### 📁 Files Created

#### Authentication
- `src/lib/auth-helpers.ts` - Auth utility functions
- `src/app/api/auth/signin/route.ts` - Sign in endpoint
- `src/app/api/auth/signout/route.ts` - Sign out endpoint
- `src/app/api/auth/session/route.ts` - Session endpoint

#### Church Management
- `src/app/api/churches/route.ts` - Church CRUD operations
- `src/app/api/onboarding/route.ts` - Church onboarding flow
- `src/app/onboarding/page.tsx` - Onboarding UI

#### User Management
- `src/app/api/users/route.ts` - User list and create
- `src/app/api/users/[id]/route.ts` - User get, update, delete
- `src/app/admin/users/page.tsx` - User management dashboard
- `src/app/admin/users/add/page.tsx` - Add user form

### 📝 Files Modified
- `src/app/api/students/route.ts` - Updated to use real auth

## Setup Instructions

### 1. Enable Supabase Auth

Make sure your `.env.local` has all required Supabase variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Test the Onboarding Flow

1. Navigate to: `http://localhost:3000/onboarding`

2. Fill in church information:
   - Church Name: "First Rainbow Church"
   - Church Email: "admin@firstrainbow.org"
   - Phone: "(555) 123-4567"

3. Create admin account:
   - Name: "John Admin"
   - Email: "john@firstrainbow.org"
   - Password: "password123"

4. Complete onboarding - you'll be automatically signed in!

### 3. Test User Management

After onboarding, you can:

1. **View Users**: Navigate to `/admin/users`
2. **Add Users**: Click "Add User" button
3. **Set Roles**: Choose between Admin or Teacher
4. **Set Permissions**: Fine-tune what each user can do

### 4. Sign In Flow

For testing sign in/out:

```bash
# Sign In
POST /api/auth/signin
{
  "email": "john@firstrainbow.org",
  "password": "password123"
}

# Sign Out
POST /api/auth/signout

# Check Session
GET /api/auth/session
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/session` - Get current session

### Churches
- `GET /api/churches` - Get current church
- `POST /api/churches` - Create church (public)
- `PUT /api/churches` - Update church (church_admin only)

### Users
- `GET /api/users` - List all users in church
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Onboarding
- `POST /api/onboarding` - Complete church onboarding

## Permission System

### Permissions Available:
- `canManageUsers` - Add/edit/delete users
- `canManageClasses` - Manage classes and assignments
- `canEditStudents` - Create and edit student records
- `canTakeAttendance` - Record attendance
- `canManageTests` - Create and grade tests
- `canViewReports` - View analytics and reports

### Default Permissions by Role:

**Church Admin** (Full Access):
- All permissions enabled

**Admin**:
- canManageUsers: ✅
- canManageClasses: ✅
- canEditStudents: ✅
- canTakeAttendance: ✅
- canManageTests: ✅
- canViewReports: ✅

**Teacher**:
- canManageUsers: ❌
- canManageClasses: ❌
- canEditStudents: ✅
- canTakeAttendance: ✅
- canManageTests: ✅
- canViewReports: ❌

## Next Steps

### Remaining Tasks:

1. **Update All API Routes** - Replace `temp-auth` with `auth-helpers` in:
   - `src/app/api/students/[id]/route.ts`
   - `src/app/api/attendance/route.ts`
   - `src/app/api/tests/route.ts`
   - `src/app/api/tests/[id]/route.ts`
   - `src/app/api/dashboard/route.ts`

2. **Update Sign In Page** - Modify existing sign-in UI to use new auth API

3. **Add Navigation** - Add link to `/admin/users` in sidebar for admins

4. **Test Multi-Tenant** - Create 2nd church and verify data isolation

5. **Add Email Invitations** - Send invites instead of creating passwords

## Testing Checklist

- [ ] Complete onboarding flow
- [ ] Sign in with created admin
- [ ] Add a teacher user
- [ ] Add an admin user
- [ ] Edit user permissions
- [ ] Delete a user
- [ ] Sign out and sign back in
- [ ] Verify students API requires auth
- [ ] Verify multi-tenant isolation

## Troubleshooting

### "Not authenticated" Error
- Make sure cookies are being set correctly
- Check browser dev tools → Application → Cookies
- Should see `sb-access-token` and `sb-refresh-token`

### "Insufficient permissions" Error
- Check user role in database
- Verify permissions JSONB in users table
- Church admins have all permissions by default

### Can't create users
- Verify Supabase service role key is correct
- Check Supabase dashboard for auth errors
- Ensure email doesn't already exist

## Security Notes

- Sessions stored in HTTP-only cookies (XSS protection)
- Service role key used server-side only
- Multi-tenant RLS policies enforce data isolation
- Passwords hashed by Supabase Auth
- Email confirmation can be enabled in Supabase dashboard
