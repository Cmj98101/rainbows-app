# Complete Workflow Guide - Rainbows App

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Complete Workflow](#complete-workflow)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [API Reference](#api-reference)
6. [UI Navigation](#ui-navigation)

---

## System Overview

The Rainbows App is a multi-tenant church management system with hierarchical permissions.

### Architecture
```
Church (Tenant)
  └── Users (Church Admin, Admin, Teachers)
       └── Classes (Age groups)
            ├── Teachers (Assigned to classes)
            ├── Students (Enrolled in classes)
            ├── Attendance (Per class, per date)
            └── Tests (Per class, with results)
```

### Technology Stack
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (replaces NextAuth + MongoDB)
- **Frontend**: Next.js 15.3, React 19, TypeScript
- **UI**: TailwindCSS + DaisyUI

---

## Complete Workflow

### 1. Church Onboarding
**URL**: `/onboarding`
**Who**: Anyone (public)

**Steps**:
1. Fill in church information (name, email, phone, address)
2. Create first admin account (Church Admin)
3. Automatically signed in
4. Redirected to dashboard

**Result**:
- New church created in database
- Church Admin user created with full permissions
- Session established

---

### 2. Add Classes
**URL**: `/admin/classes`
**Who**: Church Admin or Admin with `canManageClasses` permission

**Steps**:
1. Click "Add Class"
2. Enter class name (e.g., "Kindergarten", "1st Grade")
3. Add age group (e.g., "5-6 years")
4. Add description (optional)
5. Assign teachers (optional - can do later)

**Result**:
- Class created
- Teachers assigned to class (if selected)

---

### 3. Add Users (Teachers/Admins)
**URL**: `/admin/users`
**Who**: Church Admin or Admin with `canManageUsers` permission

**Steps**:
1. Click "Add User"
2. Enter name, email, password
3. Select role:
   - **Admin**: Can manage users and classes
   - **Teacher**: Can manage students, attendance, tests
4. Customize permissions (optional)
5. Create user

**Result**:
- User account created in Supabase Auth
- User profile created in users table
- User can now sign in

---

### 4. Assign Teachers to Classes
**URL**: `/admin/classes/[id]/edit`
**Who**: Church Admin or Admin with `canManageClasses`

**Steps**:
1. Go to Classes page
2. Click "Edit" on a class
3. Select teachers to assign
4. Save changes

**Result**:
- Teachers assigned to class
- Teachers can now:
  - Add students to their classes
  - Take attendance for their classes
  - Create tests for their classes

---

### 5. Add Students to Classes
**URL**: `/students/add`
**Who**: Anyone with `canEditStudents` permission

**Steps**:
1. Click "Add Student"
2. Enter student information (name, birthday, gender)
3. **Select class** (dropdown of available classes)
4. Add guardian information
5. Save student

**Result**:
- Student created and enrolled in class
- Student appears in class roster
- Can now take attendance and tests for this student

---

### 6. Take Attendance
**URL**: `/attendance/take-roll` (needs to be updated)
**Who**: Anyone with `canTakeAttendance` permission

**Steps**:
1. Select class
2. Select date
3. Mark students as present/absent
4. Save attendance

**Result**:
- Attendance recorded for all students in class
- Data stored with date, class, and recorded_by user

---

### 7. Create and Grade Tests
**URL**: `/tests/add`
**Who**: Anyone with `canManageTests` permission

**Steps to Create Test**:
1. Click "Add Test"
2. Enter test name and date
3. Select class
4. Save test

**Steps to Record Results**:
1. Go to Tests page
2. Click "View" on a test
3. Mark each student as Passed/Failed/Absent
4. Save results

**Result**:
- Test created for class
- Results recorded per student
- Pass rates calculated automatically

---

## User Roles & Permissions

### Church Admin (Full Access)
**Role**: `church_admin`
**Permissions**: All ✅

- Manage church settings
- Add/edit/delete users
- Create and manage classes
- Assign teachers to classes
- All teacher permissions

**Use Case**: Church leadership, main administrator

---

### Admin
**Role**: `admin`
**Default Permissions**:
- ✅ canManageUsers
- ✅ canManageClasses
- ✅ canEditStudents
- ✅ canTakeAttendance
- ✅ canManageTests
- ✅ canViewReports

**Use Case**: Department heads, senior teachers

---

### Teacher
**Role**: `teacher`
**Default Permissions**:
- ❌ canManageUsers
- ❌ canManageClasses
- ✅ canEditStudents
- ✅ canTakeAttendance
- ✅ canManageTests
- ❌ canViewReports

**Use Case**: Regular teachers, classroom instructors

---

## Step-by-Step Setup

### Initial Setup (First Time)

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Onboarding**
   ```
   http://localhost:3000/onboarding
   ```

3. **Complete Church Setup**
   - Enter church information
   - Create admin account
   - Get automatically signed in

4. **Add Your First Class**
   ```
   http://localhost:3000/admin/classes
   ```
   - Click "Add Class"
   - Name: "Kindergarten"
   - Age Group: "5-6 years"
   - Save (don't assign teachers yet)

5. **Add Teachers**
   ```
   http://localhost:3000/admin/users
   ```
   - Click "Add User"
   - Name: "Jane Teacher"
   - Email: "jane@church.org"
   - Password: "password123"
   - Role: Teacher
   - Create user

6. **Assign Teacher to Class**
   - Go back to Classes
   - Click "Edit" on Kindergarten
   - Select Jane Teacher
   - Save

7. **Add Students**
   ```
   http://localhost:3000/students/add
   ```
   - Fill in student info
   - Select "Kindergarten" from class dropdown
   - Add guardian info
   - Save

8. **You're Ready!**
   - Take attendance for Kindergarten
   - Create tests for Kindergarten
   - View reports and analytics

---

## API Reference

### Authentication
```bash
# Sign In
POST /api/auth/signin
{
  "email": "admin@church.org",
  "password": "password123"
}

# Sign Out
POST /api/auth/signout

# Check Session
GET /api/auth/session
```

### Churches
```bash
# Get Current Church
GET /api/churches
Authorization: Required

# Create Church (Public - Onboarding)
POST /api/churches
{
  "name": "First Rainbow Church",
  "email": "contact@church.org",
  "phone": "(555) 123-4567",
  "address": "123 Main St"
}

# Update Church
PUT /api/churches
Authorization: church_admin only
```

### Classes
```bash
# List Classes
GET /api/classes
Authorization: Required

# Create Class
POST /api/classes
Authorization: Requires canManageClasses
{
  "name": "Kindergarten",
  "ageGroup": "5-6 years",
  "description": "Kindergarten class",
  "teacherIds": ["uuid1", "uuid2"]
}

# Get Class
GET /api/classes/[id]

# Update Class
PUT /api/classes/[id]
{
  "name": "Updated Name",
  "teacherIds": ["uuid1", "uuid3"]
}

# Delete Class
DELETE /api/classes/[id]
```

### Users
```bash
# List Users
GET /api/users
Authorization: Requires canManageUsers

# Create User
POST /api/users
Authorization: Requires canManageUsers
{
  "name": "John Teacher",
  "email": "john@church.org",
  "password": "password123",
  "role": "teacher",
  "permissions": {
    "canManageUsers": false,
    "canManageClasses": false,
    "canEditStudents": true,
    "canTakeAttendance": true,
    "canManageTests": true,
    "canViewReports": false
  }
}

# Get User
GET /api/users/[id]

# Update User
PUT /api/users/[id]
{
  "name": "Updated Name",
  "role": "admin",
  "permissions": { ... }
}

# Delete User
DELETE /api/users/[id]
```

### Students
```bash
# List Students
GET /api/students
Authorization: Required

# Create Student
POST /api/students
Authorization: Requires canEditStudents
{
  "firstName": "Johnny",
  "lastName": "Smith",
  "birthday": "2018-05-15",
  "gender": "Male",
  "classId": "class-uuid",
  "guardians": [
    {
      "name": "Jane Smith",
      "relationship": "Mother",
      "phone": "(555) 123-4567",
      "email": "jane@example.com",
      "isEmergencyContact": true
    }
  ]
}
```

### Tests
```bash
# List Tests
GET /api/tests

# Create Test
POST /api/tests
{
  "name": "Math Quiz 1",
  "date": "2024-01-15",
  "classId": "class-uuid"
}

# Record Results
POST /api/tests/[id]/results
{
  "results": {
    "student-uuid-1": "passed",
    "student-uuid-2": "failed",
    "student-uuid-3": "absent"
  }
}
```

---

## UI Navigation

### Admin Navigation
```
/admin/users          - User Management
/admin/users/add      - Add User
/admin/classes        - Class Management
/admin/classes/add    - Add Class
/admin/classes/[id]/edit - Edit Class & Assign Teachers
```

### General Navigation
```
/                     - Dashboard
/students             - Student List
/students/add         - Add Student
/students/[id]        - View Student
/students/[id]/edit   - Edit Student
/tests                - Test List
/tests/add            - Add Test
/tests/[id]/results   - Record Test Results
/attendance           - Attendance (needs update)
/onboarding           - Church Onboarding (public)
```

---

## Remaining Tasks

### Critical (For Production)

1. **Update Attendance Flow**
   - Add class selector to attendance page
   - Update API to use auth-helpers
   - Show only students in selected class

2. **Update Student Forms**
   - Add class dropdown to add/edit student forms
   - Make class selection required
   - Show available classes from API

3. **Update Remaining APIs**
   - `/api/students/[id]/route.ts` - use auth-helpers
   - `/api/attendance/route.ts` - use auth-helpers
   - `/api/tests/[id]/route.ts` - use auth-helpers
   - `/api/dashboard/route.ts` - use auth-helpers

4. **Update Sign In Page**
   - Modify `/app/auth/signin` to use new auth API
   - Remove NextAuth dependencies
   - Use `/api/auth/signin` endpoint

5. **Add Navigation Links**
   - Add "Users" link in sidebar (admin only)
   - Add "Classes" link in sidebar (admin only)
   - Show/hide based on permissions

### Nice to Have

1. **Email Invitations**
   - Send invite emails instead of creating passwords
   - User sets password on first sign in

2. **Class Schedule Display**
   - Show class meeting times
   - Calendar view

3. **Reports Dashboard**
   - Attendance trends
   - Test performance analytics
   - Student progress reports

4. **Bulk Operations**
   - Import students from CSV
   - Bulk attendance entry
   - Mass email guardians

---

## Testing Checklist

- [ ] Complete church onboarding
- [ ] Sign in as church admin
- [ ] Create a class
- [ ] Add a teacher user
- [ ] Assign teacher to class
- [ ] Sign out and sign in as teacher
- [ ] Add student to class
- [ ] Take attendance for class
- [ ] Create test for class
- [ ] Record test results
- [ ] Verify multi-tenant isolation
- [ ] Test permission restrictions

---

## Security Notes

✅ **What's Secure**:
- HTTP-only cookies (XSS protection)
- Multi-tenant RLS policies
- Role-based access control
- Password hashing by Supabase
- Server-side authentication checks

⚠️ **Production Checklist**:
- [ ] Enable email confirmation in Supabase
- [ ] Set up custom SMTP for emails
- [ ] Add rate limiting to auth endpoints
- [ ] Enable 2FA for church admins
- [ ] Regular database backups
- [ ] Monitor for suspicious activity

---

## Support

For issues or questions:
1. Check this documentation
2. Review `ADMIN_SYSTEM_SETUP.md`
3. Check Supabase logs for errors
4. Verify environment variables are set

**Key Files**:
- `src/lib/auth-helpers.ts` - Authentication utilities
- `src/lib/supabase-helpers.ts` - Database operations
- `src/app/api/` - All API routes
- `supabase/migrations/` - Database schema
