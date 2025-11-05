# Supabase Migration Guide

This guide walks you through migrating the Rainbows App from MongoDB to Supabase.

## 📋 Prerequisites

1. Supabase account created at https://supabase.com
2. New Supabase project created
3. Environment variables ready

## 🔐 Step 1: Add Environment Variables

Add these variables to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Keep MongoDB vars for now (for data migration)
MONGODB_URI=your-mongodb-uri
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Click **Project Settings** (gear icon)
3. Click **API** in the sidebar
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ Step 2: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for success message
8. Repeat steps 3-7 for `supabase/migrations/002_rls_policies.sql`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Verify Migration Success

Run this query in SQL Editor to check tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- attendance
- churches
- class_teachers
- classes
- guardians
- students
- test_results
- tests
- users

## 🔄 Step 3: Migrate Data from MongoDB (Optional)

If you have existing data in MongoDB, run the migration script:

```bash
npm run migrate:mongo-to-supabase
```

This script will:
1. Export all data from MongoDB
2. Transform nested structures to relational format
3. Import data into Supabase
4. Preserve all relationships

**Note:** This step is optional if you're starting fresh or testing.

## 🧪 Step 4: Test the Setup

### Test Database Connection

Create a test file `test-supabase.js`:

```javascript
import { supabaseAdmin } from './src/lib/supabase.ts';

async function testConnection() {
  const { data, error } = await supabaseAdmin
    .from('churches')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Connection failed:', error);
  } else {
    console.log('✅ Connection successful!');
  }
}

testConnection();
```

Run: `node test-supabase.js`

## 🏗️ Step 5: Update Application Code

The following files need to be updated to use Supabase:

### API Routes to Update:
- [ ] `/src/app/api/auth/*` - Replace NextAuth with Supabase Auth
- [ ] `/src/app/api/students/*` - Use Supabase queries
- [ ] `/src/app/api/attendance/*` - Use Supabase queries
- [ ] `/src/app/api/tests/*` - Use Supabase queries
- [ ] `/src/app/api/dashboard/*` - Use Supabase queries

### Pages to Update:
- [ ] Authentication pages (sign in, register)
- [ ] Student management pages
- [ ] Attendance pages
- [ ] Test management pages
- [ ] Dashboard

## 📊 Data Structure Changes

### Before (MongoDB - Nested)
```javascript
{
  firstName: "John",
  guardians: [
    { name: "Jane Doe", phone: "555-1234" }
  ],
  attendance: [
    { date: "2024-01-01", present: true }
  ]
}
```

### After (Supabase - Relational)
```sql
-- students table
{ id: "uuid", first_name: "John" }

-- guardians table (separate)
{ id: "uuid", student_id: "uuid", name: "Jane Doe" }

-- attendance table (separate)
{ id: "uuid", student_id: "uuid", date: "2024-01-01", present: true }
```

## 🔒 Security Features

### Row-Level Security (RLS)

RLS is automatically enabled! This means:

- ✅ Users can only see data from their own church
- ✅ Teachers can only edit students in their assigned classes
- ✅ Church admins have full control over their church
- ✅ Database enforces multi-tenancy automatically

### Example Queries (RLS Handles Isolation)

```javascript
// This automatically filters by user's church_id
const { data: students } = await supabaseAdmin
  .from('students')
  .select('*');

// No need to manually add church_id filter - RLS does it!
```

## 🚀 Running the App

```bash
# Development
npm run dev

# The app will now use Supabase instead of MongoDB
```

## 🔄 Switching Back to MongoDB

To switch back to the MongoDB version:

```bash
git checkout main
```

Your MongoDB data is untouched and ready to use!

## 🆘 Troubleshooting

### "relation does not exist" error
- Run the migration SQL files in order
- Check SQL Editor for any error messages

### "row-level security policy violation"
- Make sure you're authenticated
- Check that RLS policies were created (002_rls_policies.sql)
- Verify user has correct role and church_id

### "Cannot connect to Supabase"
- Verify environment variables are set correctly
- Check that NEXT_PUBLIC_SUPABASE_URL starts with `https://`
- Ensure keys don't have extra spaces or quotes

### "Permission denied for table"
- You might be using anon key instead of service_role key
- Check that you're using `supabaseAdmin` in API routes

## 📚 Next Steps

1. **Test with sample data** - Create a test church, class, and students
2. **Update API routes** - One feature at a time (start with students)
3. **Update frontend** - Match new data structure
4. **Add real-time features** - Use Supabase subscriptions
5. **Deploy** - Update production environment variables

## 🎯 New Features Available

With Supabase, you now have access to:

- **Real-time subscriptions** - Live attendance updates
- **Built-in authentication** - Remove NextAuth dependency
- **Storage** - Upload student photos, documents
- **Edge functions** - Serverless API endpoints
- **Auto-generated APIs** - REST and GraphQL endpoints

## 📖 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
