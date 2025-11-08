# User Migration Guide: MongoDB → Supabase

This guide will help you migrate users from your MongoDB database to Supabase.

## Prerequisites

Before migrating, you need:

1. ✅ The user's **email** from MongoDB
2. ✅ The user's **name** from MongoDB
3. ✅ The user's **role** from MongoDB (`church_admin`, `admin`, or `teacher`)
4. ✅ A **new password** for the user (they can change it later)
5. ✅ Your **church UUID** from Supabase

## Finding Your Church UUID

Run this query in Supabase SQL Editor:

```sql
SELECT id, name FROM churches;
```

Copy the UUID of your church.

## Method 1: Using the Migration Script (Recommended)

### Step 1: Install TypeScript runner

```bash
npm install -D tsx
```

### Step 2: Edit the migration script

Open `scripts/migrate-user.ts` and fill in the user data around line 24:

```typescript
const userData: MongoUser = {
  email: email,
  name: 'John Smith', // ← FILL THIS IN from MongoDB
  role: 'teacher',    // ← FILL THIS IN (church_admin, admin, or teacher)
  churchId: 'YOUR-CHURCH-UUID-HERE', // ← FILL THIS IN
};
```

### Step 3: Run the migration

```bash
npx tsx scripts/migrate-user.ts user@example.com NewPassword123
```

Replace:
- `user@example.com` with the user's email
- `NewPassword123` with a temporary password (user can change later)

### Step 4: Test the login

Have the user sign in at `/auth/signin` with their email and the new password.

---

## Method 2: Manual Migration (Using Supabase UI)

### Step 1: Create Auth User

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add User**
3. Fill in:
   - **Email**: user@example.com
   - **Password**: Temporary password
   - **Auto Confirm User**: ✅ YES
4. Click **Create User**
5. **Copy the User ID** (UUID) - you'll need this

### Step 2: Create User Profile

Go to **Supabase Dashboard** → **Table Editor** → **users** → **Insert** → **Insert row**

Fill in:
- **id**: Paste the User ID from Step 1
- **church_id**: Your church UUID
- **email**: user@example.com
- **name**: User's full name
- **role**: `teacher` (or `admin` or `church_admin`)
- **permissions**: Click and paste:

For **teachers**:
```json
{
  "canManageUsers": false,
  "canManageClasses": false,
  "canEditStudents": true,
  "canTakeAttendance": true,
  "canManageTests": true,
  "canViewReports": false
}
```

For **admins**:
```json
{
  "canManageUsers": true,
  "canManageClasses": true,
  "canEditStudents": true,
  "canTakeAttendance": true,
  "canManageTests": true,
  "canViewReports": true
}
```

### Step 3: Test the login

Have the user sign in at `/auth/signin`.

---

## Method 3: Using SQL (Fastest for Multiple Users)

### Step 1: Get MongoDB user data

Export user data from MongoDB:
- Email
- Name
- Role

### Step 2: Run this SQL in Supabase SQL Editor

```sql
-- First, create the auth user (do this via Supabase UI or Auth Admin API)
-- Then insert the profile:

INSERT INTO users (id, church_id, email, name, role, permissions)
VALUES (
  'AUTH-USER-ID-FROM-SUPABASE-AUTH',
  'YOUR-CHURCH-UUID',
  'user@example.com',
  'John Smith',
  'teacher',
  '{"canManageUsers": false, "canManageClasses": false, "canEditStudents": true, "canTakeAttendance": true, "canManageTests": true, "canViewReports": false}'::jsonb
);
```

---

## Important Notes

### Password Security

- Set a **temporary password** during migration
- Send the user their temporary password securely (not via email if possible)
- Ask them to change it after first login

### Church ID Matching

- Make sure the `church_id` matches your Supabase church UUID
- If you migrated churches from MongoDB, find the mapping

### Role Mapping

MongoDB roles should map to Supabase as follows:

| MongoDB Role | Supabase Role |
|--------------|---------------|
| `churchAdmin` | `church_admin` |
| `admin` | `admin` |
| `teacher` | `teacher` |

### Permissions

Teachers get limited permissions by default:
- ✅ Can edit students
- ✅ Can take attendance
- ✅ Can manage tests
- ❌ Cannot manage users
- ❌ Cannot manage classes
- ❌ Cannot view reports

Admins get full permissions.

---

## Troubleshooting

### "Email already exists"

If you get this error, the user already exists in Supabase Auth. Check:

```sql
-- Check if user profile exists
SELECT * FROM users WHERE email = 'user@example.com';

-- If it exists, you're done! They can sign in.
```

### "Church not found"

Verify your church UUID:

```sql
SELECT id, name FROM churches;
```

Make sure you copied the correct UUID.

### "Failed to create user profile"

Check if the auth user was created:
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Search for the email
3. If it exists but has no profile, manually create the profile using Method 2, Step 2

### User can't sign in

1. Check that the user exists in both places:
   - **Authentication** → **Users** (auth user)
   - **Table Editor** → **users** (user profile)
2. Make sure the IDs match (auth user ID = users table ID)
3. Verify the email is confirmed in Supabase Auth

---

## Batch Migration Script

If you need to migrate many users, here's a template:

```typescript
// scripts/batch-migrate-users.ts
import { supabaseAdmin } from '../src/lib/supabase';

const users = [
  { email: 'user1@example.com', name: 'User 1', role: 'teacher', password: 'temp123' },
  { email: 'user2@example.com', name: 'User 2', role: 'admin', password: 'temp456' },
  // Add more users...
];

const CHURCH_ID = 'YOUR-CHURCH-UUID-HERE';

async function migrateAll() {
  for (const user of users) {
    console.log(`Migrating ${user.email}...`);

    // Create auth user
    const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    // Create profile
    await supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      church_id: CHURCH_ID,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: getPermissions(user.role),
    });

    console.log(`✅ Migrated ${user.email}`);
  }
}

function getPermissions(role: string) {
  if (role === 'church_admin' || role === 'admin') {
    return {
      canManageUsers: true,
      canManageClasses: true,
      canEditStudents: true,
      canTakeAttendance: true,
      canManageTests: true,
      canViewReports: true,
    };
  }
  return {
    canManageUsers: false,
    canManageClasses: false,
    canEditStudents: true,
    canTakeAttendance: true,
    canManageTests: true,
    canViewReports: false,
  };
}

migrateAll();
```

Run with:
```bash
npx tsx scripts/batch-migrate-users.ts
```

---

## Quick Reference

**To find your church UUID:**
```sql
SELECT id, name FROM churches;
```

**To check if a user exists:**
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

**To reset a user's password in Supabase:**
1. Go to **Authentication** → **Users**
2. Find the user
3. Click the 3 dots → **Reset Password**
4. Enter new password

---

## Need Help?

If you run into issues:
1. Check the Supabase logs: **Logs** → **Postgres Logs**
2. Verify both auth user and profile exist
3. Make sure church_id matches your actual church UUID
4. Test login at `/auth/signin`
