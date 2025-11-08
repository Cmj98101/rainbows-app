# Migration & User Management Scripts

This folder contains helper scripts for managing users and migrating from MongoDB to Supabase.

## Quick Start

### Install TypeScript Runner

```bash
npm install -D tsx
```

## Available Scripts

### 1. Get Church ID

Find your church UUID (needed for user migration):

```bash
npx tsx scripts/get-church-id.ts
```

This displays all churches with their UUIDs.

---

### 2. Add User (Interactive)

**Easiest way to add a user** - interactive prompts guide you through:

```bash
npx tsx scripts/add-user.ts
```

The script will ask for:
- Which church
- Email
- Name
- Password
- Role (church_admin, admin, or teacher)

---

### 3. Migrate User (From MongoDB)

Migrate a single user from MongoDB:

```bash
npx tsx scripts/migrate-user.ts user@example.com TempPassword123
```

**Before running:**
1. Open `scripts/migrate-user.ts`
2. Edit lines 24-28 to fill in the user data:
   ```typescript
   const userData: MongoUser = {
     email: email,
     name: 'John Smith',        // ← Fill this in
     role: 'teacher',            // ← Fill this in
     churchId: 'YOUR-UUID-HERE', // ← Fill this in
   };
   ```
3. Save the file
4. Run the command above

---

## Common Workflows

### Migrate a Single User from MongoDB

1. **Get the church UUID:**
   ```bash
   npx tsx scripts/get-church-id.ts
   ```

2. **Get user info from MongoDB:**
   - Email
   - Name
   - Role

3. **Choose a method:**

   **Option A: Interactive (Easiest)**
   ```bash
   npx tsx scripts/add-user.ts
   ```

   **Option B: Script with MongoDB data**
   - Edit `scripts/migrate-user.ts` with user data
   - Run: `npx tsx scripts/migrate-user.ts user@example.com Password123`

4. **Test login:**
   - Go to `/auth/signin`
   - Sign in with email and password

---

### Add Multiple Users at Once

See `USER_MIGRATION_GUIDE.md` for the batch migration script template.

---

## Roles & Permissions

### Church Admin
- ✅ Full access to everything
- ✅ Can manage users
- ✅ Can manage classes
- ✅ Can edit students
- ✅ Can take attendance
- ✅ Can manage tests
- ✅ Can view reports

### Admin
- ✅ Full access to everything
- ✅ Can manage users
- ✅ Can manage classes
- ✅ Can edit students
- ✅ Can take attendance
- ✅ Can manage tests
- ✅ Can view reports

### Teacher
- ❌ Cannot manage users
- ❌ Cannot manage classes (but can view assigned classes)
- ✅ Can edit students (only in their classes)
- ✅ Can take attendance (only for their classes)
- ✅ Can manage tests (only for their classes)
- ❌ Cannot view reports

---

## Troubleshooting

### "Email already exists"

The user already exists in Supabase. Check if they can sign in.

### "Church not found"

Run `npx tsx scripts/get-church-id.ts` to verify your church UUID.

### User can't sign in

1. Check **Supabase Dashboard** → **Authentication** → **Users**
2. Verify user exists
3. Check **Table Editor** → **users** table
4. Make sure both exist with matching IDs

### Need to reset password

**Via Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. Find the user
3. Click 3 dots → **Reset Password**

**Via your app:**
- Users can use the "Forgot Password" flow (if implemented)
- Or admins can reset via the user management page

---

## Files in This Folder

- `get-church-id.ts` - Display all churches and their UUIDs
- `add-user.ts` - Interactive script to add a new user
- `migrate-user.ts` - Migrate single user from MongoDB (requires editing)
- `README.md` - This file

---

## Need More Help?

See the comprehensive guide:
- `USER_MIGRATION_GUIDE.md` - Complete migration documentation

For code-related questions, check:
- `ADMIN_SYSTEM_SETUP.md` - Admin system overview
- `AUTHENTICATION_GUIDE.md` - Auth system details
- `TEACHER_PERMISSIONS_GUIDE.md` - Teacher role restrictions
