# Supabase Examples & Code Patterns

This document provides code examples and patterns for using Supabase in the Rainbows App.

## 📁 Example Files Created

1. **`src/lib/supabase.ts`** - Supabase client configuration
2. **`src/types/supabase.ts`** - TypeScript type definitions
3. **`src/app/api/supabase-examples/students/route.ts`** - API route examples
4. **`src/app/api/supabase-examples/auth/route.ts`** - Authentication examples
5. **`src/app/supabase-examples/page.tsx`** - Client component examples
6. **`supabase/migrations/`** - Database schema and RLS policies
7. **`scripts/migrate-mongo-to-supabase.ts`** - Data migration script

## 🔧 Setup Required

Before using these examples:

1. ✅ Create Supabase project
2. ✅ Add environment variables to `.env.local`
3. ✅ Run database migrations (see SUPABASE_MIGRATION.md)

## 📚 Common Patterns

### Pattern 1: Fetching Data (Server Component)

```typescript
// src/app/students/page.tsx
import { supabaseAdmin } from '@/lib/supabase';

export default async function StudentsPage() {
  // Fetch students with guardians
  const { data: students, error } = await supabaseAdmin
    .from('students')
    .select(`
      *,
      guardians (*),
      class:classes (
        id,
        name,
        age_group
      )
    `)
    .eq('church_id', 'user-church-id')
    .order('last_name', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return <div>Error loading students</div>;
  }

  return (
    <div>
      {students.map(student => (
        <div key={student.id}>
          {student.first_name} {student.last_name}
          <p>Class: {student.class?.name}</p>
          <p>Guardians: {student.guardians?.length || 0}</p>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Fetching Data (Client Component)

```typescript
// src/components/StudentList.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import type { Student } from '@/types/supabase';

export function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .order('last_name');

      if (!error) setStudents(data);
      setLoading(false);
    }

    fetchStudents();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {students.map(s => (
        <li key={s.id}>{s.first_name} {s.last_name}</li>
      ))}
    </ul>
  );
}
```

### Pattern 3: API Route (POST)

```typescript
// src/app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Get user from session (implement auth first)
  const churchId = 'user-church-id';

  const { data: student, error } = await supabaseAdmin
    .from('students')
    .insert({
      church_id: churchId,
      first_name: body.firstName,
      last_name: body.lastName,
      birthday: body.birthday,
      class_id: body.classId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(student, { status: 201 });
}
```

### Pattern 4: Complex Joins

```typescript
// Fetch students with all related data
const { data } = await supabaseAdmin
  .from('students')
  .select(`
    *,
    guardians (*),
    class:classes (
      id,
      name,
      teachers:class_teachers (
        teacher:users (
          id,
          name,
          email
        )
      )
    ),
    attendance (
      id,
      date,
      present
    ),
    test_results (
      id,
      status,
      test:tests (
        id,
        name,
        date
      )
    )
  `)
  .eq('id', studentId)
  .single();
```

### Pattern 5: Filtering and Searching

```typescript
// Search students by name
const { data } = await supabaseAdmin
  .from('students')
  .select('*')
  .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  .eq('church_id', churchId);

// Filter by multiple conditions
const { data } = await supabaseAdmin
  .from('students')
  .select('*')
  .eq('church_id', churchId)
  .eq('class_id', classId)
  .gte('birthday', '2010-01-01')
  .order('last_name');
```

### Pattern 6: Transactions (Multiple Inserts)

```typescript
// Create student with guardians in one transaction
const { data: student, error: studentError } = await supabaseAdmin
  .from('students')
  .insert({
    church_id: churchId,
    first_name: 'John',
    last_name: 'Doe',
  })
  .select()
  .single();

if (studentError) throw studentError;

// Insert guardians
const guardians = [
  { student_id: student.id, name: 'Jane Doe', relationship: 'Mother' },
  { student_id: student.id, name: 'Jack Doe', relationship: 'Father' },
];

const { error: guardianError } = await supabaseAdmin
  .from('guardians')
  .insert(guardians);

if (guardianError) {
  // Rollback student insert if needed
  await supabaseAdmin.from('students').delete().eq('id', student.id);
  throw guardianError;
}
```

### Pattern 7: Real-time Subscriptions

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';

export function LiveAttendance({ classId }: { classId: string }) {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    // Initial fetch
    fetchAttendance();

    // Subscribe to changes
    const channel = supabaseClient
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          console.log('New attendance:', payload.new);
          fetchAttendance(); // Refetch
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [classId]);

  async function fetchAttendance() {
    const { data } = await supabaseClient
      .from('attendance')
      .select('*, student:students (*)')
      .eq('class_id', classId)
      .eq('date', new Date().toISOString().split('T')[0]);

    setAttendance(data || []);
  }

  return <div>{/* Render attendance */}</div>;
}
```

### Pattern 8: Authentication

```typescript
// Sign up
const { data, error } = await supabaseClient.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Get session
const { data: { session } } = await supabaseClient.auth.getSession();

// Sign out
await supabaseClient.auth.signOut();

// Get current user
const { data: { user } } = await supabaseClient.auth.getUser();
```

### Pattern 9: Using RLS (Row Level Security)

```typescript
// RLS automatically filters by church_id!

// As a teacher, this query automatically:
// 1. Only shows students from YOUR church
// 2. Only allows editing students in YOUR assigned classes
const { data: students } = await supabaseClient
  .from('students')
  .select('*');
// ✅ Automatically filtered by church_id from session

// No need to manually add .eq('church_id', churchId)
// RLS policies handle it automatically!
```

### Pattern 10: Aggregations and Reports

```typescript
// Get attendance statistics
const { data } = await supabaseAdmin
  .rpc('get_attendance_stats', {
    p_church_id: churchId,
    p_start_date: '2024-01-01',
    p_end_date: '2024-12-31',
  });

// Or use aggregation:
const { data: stats } = await supabaseAdmin
  .from('attendance')
  .select('present, class_id')
  .eq('date', today);

// Calculate attendance rate
const total = stats.length;
const present = stats.filter(s => s.present).length;
const rate = (present / total) * 100;
```

## 🔐 Security Best Practices

### 1. Always Use RLS

Row-Level Security is enabled on all tables. It automatically filters data based on the authenticated user's church_id.

### 2. Use Service Role Key Only on Server

```typescript
// ✅ Good: Server-side (API routes, server components)
import { supabaseAdmin } from '@/lib/supabase';

// ❌ Bad: Never use service role key on client
import { supabaseClient } from '@/lib/supabase';
```

### 3. Validate Input

```typescript
// Always validate user input
if (!firstName || !lastName) {
  return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
}

// Sanitize data
const cleanName = firstName.trim().substring(0, 100);
```

### 4. Handle Errors Properly

```typescript
const { data, error } = await supabaseAdmin
  .from('students')
  .insert(student);

if (error) {
  console.error('Database error:', error);
  // Don't expose internal errors to client
  return NextResponse.json(
    { error: 'Failed to create student' },
    { status: 500 }
  );
}
```

## 📊 Migration from MongoDB

### Before (MongoDB)

```javascript
// Nested documents
const student = await Student.findOne({ _id: id })
  .populate('guardians')
  .lean();

student.guardians[0].name; // Access nested array
```

### After (Supabase)

```typescript
// Relational joins
const { data: student } = await supabaseAdmin
  .from('students')
  .select(`
    *,
    guardians (*)
  `)
  .eq('id', id)
  .single();

student.guardians?.[0]?.name; // Access joined data
```

## 🚀 Next Steps

1. **Replace MongoDB API routes** - Start with students CRUD
2. **Implement Supabase Auth** - Replace NextAuth
3. **Add real-time features** - Live attendance updates
4. **Optimize queries** - Add proper indexes
5. **Test RLS policies** - Verify multi-tenant isolation

## 📖 Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [RLS Examples](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
