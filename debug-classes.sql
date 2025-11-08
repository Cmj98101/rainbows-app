-- Check all classes in the database
SELECT
  id,
  name,
  church_id,
  age_group,
  created_at
FROM classes
ORDER BY created_at DESC
LIMIT 10;

-- Check the church_id for user sandra@test.com
SELECT
  id,
  email,
  name,
  church_id,
  role
FROM users
WHERE email = 'sandra@test.com';

-- Check if church_ids match
SELECT
  c.id as class_id,
  c.name as class_name,
  c.church_id as class_church_id,
  u.email,
  u.church_id as user_church_id,
  CASE
    WHEN c.church_id = u.church_id THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as church_match
FROM classes c
CROSS JOIN users u
WHERE u.email = 'sandra@test.com'
ORDER BY c.created_at DESC;
