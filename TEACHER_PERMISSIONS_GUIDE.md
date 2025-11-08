# Teacher Permissions & RLS Setup Guide

## Overview

This guide explains how teacher permissions work in the Rainbows App and how to apply the Row Level Security (RLS) policies.

## How Teacher Permissions Work

### Role Hierarchy

1. **Church Admin** - Full access to everything in their church
2. **Admin** - Can manage users, classes, students, attendance, and tests
3. **Teacher** - Limited access to only their assigned classes and students

### What Teachers Can See

Teachers are **restricted** to only viewing and managing:
- **Classes**: Only classes they are assigned to (via `class_teachers` table)
- **Students**: Only students enrolled in their assigned classes
- **Attendance**: Only attendance records for their class students
- **Test Results**: Only test results for their class students

### What Teachers Cannot See

Teachers **cannot** see:
- Classes they are not assigned to
- Students in other teachers' classes
- Attendance for students not in their classes
- User management pages (unless they have `canManageUsers` permission)
- Other churches' data (multi-tenant isolation)

## Implementation Details

### API Route Changes

The following API routes now filter data based on teacher permissions:

#### 1. `/api/students` (GET)
```typescript
// Teachers only see students in their assigned classes
if (isTeacher && !isAdmin) {
  const userId = await getCurrentUserId();
  students = await getStudentsForTeacher(userId, churchId);
} else {
  students = await getStudentsWithGuardians(churchId);
}
```

#### 2. `/api/classes` (GET)
```typescript
// Teachers only see their assigned classes
if (isTeacher && !isAdmin) {
  const userId = await getCurrentUserId();
  classes = await getClassesForTeacher(userId);
} else {
  classes = await getClasses(churchId);
}
```

### Helper Functions Added

#### `getStudentsForTeacher(teacherId, churchId)`
- Gets all students enrolled in the teacher's assigned classes
- Returns empty array if teacher has no class assignments
- Located in: `src/lib/supabase-helpers.ts:201-228`

#### `getClassesForTeacher(teacherId)`
- Gets all classes assigned to a teacher
- Used by both students and classes API routes
- Located in: `src/lib/supabase-helpers.ts:152-164`

## Applying RLS Policies

### Step 1: Configure Supabase Authentication

1. Go to **Authentication → Providers** in Supabase dashboard
2. Enable **Email** provider
3. Go to **Authentication → Settings**
4. **Disable** "Enable email confirmations" (we auto-confirm users in code)
5. Set **Site URL** to `http://localhost:3000` (or your production URL)

### Step 2: Apply RLS Policies

1. Open the Supabase SQL Editor
2. Copy the contents of `supabase-rls-policies.sql`
3. Paste into the SQL Editor
4. Click **Run**

This will:
- Enable RLS on all tables
- Create policies for SELECT, INSERT, UPDATE, DELETE operations
- Enforce multi-tenant isolation (users can only access their church's data)
- Restrict teachers to their assigned classes only

### Step 3: Verify RLS Policies

Run these verification queries in the SQL Editor:

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

You should see:
- ✅ All 9 tables have `rowsecurity = true`
- ✅ Multiple policies per table for different operations

## RLS Policy Summary

### Churches Table
- ✅ Users can view their own church
- ✅ Church admins can update their church
- ✅ Anyone can create a church (for onboarding)

### Users Table
- ✅ Users can view other users in their church
- ✅ Users with `canManageUsers` can manage users
- ✅ Multi-tenant isolation enforced

### Classes Table
- ✅ Users can view classes in their church
- ✅ Users with `canManageClasses` can manage classes
- ✅ Teachers will see filtered results via API logic

### Class_Teachers Table
- ✅ Users can view assignments in their church
- ✅ Only users with `canManageClasses` can modify assignments

### Students Table
- ✅ Admins see all students in their church
- ✅ **Teachers only see students in their assigned classes** 🔒
- ✅ Users with `canEditStudents` can manage students

### Guardians Table
- ✅ Users can view guardians for students they can see
- ✅ Inherits student access restrictions

### Attendance Table
- ✅ Admins see all attendance in their church
- ✅ **Teachers only see attendance for their class students** 🔒
- ✅ Users with `canTakeAttendance` can manage attendance

### Tests Table
- ✅ Users can view tests in their church
- ✅ Users with `canManageTests` can manage tests

### Test_Results Table
- ✅ Users can view results for students they can see
- ✅ Inherits student access restrictions

## Testing Teacher Permissions

### Test Scenario 1: Teacher with One Class

1. Create a church (via `/onboarding`)
2. Sign in as church admin
3. Create a class: "Kindergarten"
4. Create a teacher user and assign to "Kindergarten"
5. Create 3 students, assign 2 to "Kindergarten", 1 to no class
6. Sign out, sign in as the teacher
7. Navigate to Students page
8. **Expected**: Teacher sees only 2 students (the ones in Kindergarten)

### Test Scenario 2: Teacher with Multiple Classes

1. Create two classes: "Class A" and "Class B"
2. Create a teacher and assign to both classes
3. Create 5 students: 2 in Class A, 2 in Class B, 1 unassigned
4. Sign in as the teacher
5. **Expected**: Teacher sees 4 students (Class A + Class B students)

### Test Scenario 3: Teacher with No Classes

1. Create a teacher but don't assign any classes
2. Create students in various classes
3. Sign in as the teacher
4. **Expected**: Teacher sees 0 students

## Security Notes

### Double Layer Security

The app uses **two layers** of security:

1. **Application Logic** (API Routes)
   - Routes check user role and permissions
   - Filters data based on teacher assignments
   - Located in: `src/app/api/*/route.ts`

2. **Database RLS Policies**
   - Additional protection at database level
   - Prevents data leaks even if application logic fails
   - Applies to direct database queries

### Service Role Key

The backend uses the **service role key** which bypasses RLS. This is intentional because:
- Application logic handles permission checks
- Service role allows flexibility for complex queries
- RLS policies protect against client-side exploits

For maximum security, you could:
- Use the **anon key** for client-side queries
- Use the **service role** only for admin operations
- Let RLS enforce all permissions

## Troubleshooting

### Teacher Can See All Students

**Problem**: Teacher sees students from all classes, not just theirs.

**Solution**:
1. Check if teacher has `admin` role (admins can see all)
2. Verify teacher is assigned to classes in `class_teachers` table
3. Check API route logic in `src/app/api/students/route.ts:16-25`

### No Students Showing for Teacher

**Problem**: Teacher has classes assigned but sees no students.

**Solution**:
1. Verify students have `class_id` set in the `students` table
2. Check `class_teachers` has entries for this teacher
3. Run query:
   ```sql
   SELECT s.first_name, s.last_name, c.name as class_name
   FROM students s
   JOIN classes c ON s.class_id = c.id
   JOIN class_teachers ct ON ct.class_id = c.id
   WHERE ct.teacher_id = 'TEACHER_USER_ID';
   ```

### RLS Policy Conflicts

**Problem**: Policies are preventing legitimate access.

**Solution**:
1. Check policy conditions match your user structure
2. Verify `permissions` JSONB column format matches policies
3. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE students DISABLE ROW LEVEL SECURITY;
   ```
4. Re-enable after testing:
   ```sql
   ALTER TABLE students ENABLE ROW LEVEL SECURITY;
   ```

## Next Steps

After applying RLS policies:

1. ✅ Test the complete workflow with different user roles
2. ✅ Create teachers and assign them to classes
3. ✅ Verify teachers can only see their data
4. ✅ Test attendance and test features with teacher accounts
5. ✅ Review Supabase logs for any RLS errors

## Files Modified

- `src/lib/supabase-helpers.ts` - Added `getStudentsForTeacher()`
- `src/app/api/students/route.ts` - Filter by teacher's classes
- `src/app/api/classes/route.ts` - Filter by teacher's classes
- `supabase-rls-policies.sql` - Complete RLS policy set

## Related Documentation

- `ADMIN_SYSTEM_SETUP.md` - Admin system overview
- `COMPLETE_WORKFLOW_GUIDE.md` - Complete user workflow
- `AUTHENTICATION_GUIDE.md` - Authentication system details
