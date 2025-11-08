# MongoDB to Supabase Conversion Guide

## The Problem

MongoDB uses **camelCase** for field names, while PostgreSQL (Supabase) uses **snake_case**.

Your frontend was built for MongoDB, so it sends/expects camelCase. Your database now expects snake_case.

## The Solution

We've created centralized conversion utilities in `src/lib/case-converters.ts`.

## How to Use

### 1. Import the converters

```typescript
import { toSnakeCase, toCamelCase } from "@/lib/case-converters";
```

### 2. Converting Frontend → Database (Incoming Requests)

**Before (Manual - DON'T DO THIS):**
```typescript
const student = await createStudent(churchId, {
  first_name: body.firstName,
  last_name: body.lastName,
  class_id: body.classId,
  // ... manual conversion for every field
});
```

**After (Centralized - DO THIS):**
```typescript
const student = await createStudent(
  churchId,
  toSnakeCase(body)
);
```

### 3. Converting Database → Frontend (Outgoing Responses)

**Before (Manual):**
```typescript
return NextResponse.json({
  _id: student.id,
  firstName: student.first_name,
  lastName: student.last_name,
  // ... manual conversion
});
```

**After (Centralized):**
```typescript
return NextResponse.json(toCamelCase(student));
```

## Updated API Routes

### ✅ Students API
- `src/app/api/students/route.ts` - Uses `toSnakeCase()`
- `src/app/api/students/[id]/route.ts` - Uses `toSnakeCase()`

### 🔲 TODO: Apply to Other Routes
You should update these routes to use the converters:

- [ ] `src/app/api/tests/route.ts`
- [ ] `src/app/api/tests/[id]/route.ts`
- [ ] `src/app/api/attendance/route.ts`
- [ ] `src/app/api/classes/route.ts` (partially done)
- [ ] `src/app/api/users/route.ts`

## Pattern for Each Endpoint

### POST (Create)
```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Convert camelCase → snake_case
  const dbData = toSnakeCase(body);

  const result = await createSomething(churchId, dbData);

  // Optionally convert back: snake_case → camelCase
  return NextResponse.json(toCamelCase(result));
}
```

### PUT (Update)
```typescript
export async function PUT(request: Request) {
  const body = await request.json();

  // Convert camelCase → snake_case
  const dbUpdates = toSnakeCase(body);

  const result = await updateSomething(id, dbUpdates);

  return NextResponse.json(toCamelCase(result));
}
```

### GET (Read)
```typescript
export async function GET() {
  const data = await getSomething(churchId);

  // Convert snake_case → camelCase
  return NextResponse.json(toCamelCase(data));
}
```

## Benefits

✅ **DRY**: Write the conversion logic once, use everywhere
✅ **Consistent**: All endpoints use the same conversion
✅ **Maintainable**: If you need to change conversion logic, change it in one place
✅ **Less Error-Prone**: No manual mapping that can be forgotten or done incorrectly
✅ **Deep Conversion**: Handles nested objects and arrays automatically

## Notes

- The converters handle **deep conversion** (nested objects and arrays)
- If you need custom conversion logic, add it to `case-converters.ts`
- The `studentToDb()` and `studentFromDb()` functions are examples of entity-specific converters if you need special handling
