/**
 * Case Conversion Utilities
 *
 * Handles conversion between MongoDB (camelCase) and PostgreSQL (snake_case)
 * for the migration from MongoDB to Supabase
 */

/**
 * Convert camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert an object's keys from camelCase to snake_case
 * Deep conversion - handles nested objects and arrays
 */
export function toSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key);
      converted[snakeKey] = toSnakeCase(value);
    }

    return converted;
  }

  return obj;
}

/**
 * Convert an object's keys from snake_case to camelCase
 * Deep conversion - handles nested objects and arrays
 */
export function toCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      converted[camelKey] = toCamelCase(value);
    }

    return converted;
  }

  return obj;
}

/**
 * Student-specific conversion from frontend format to database format
 */
export function studentToDb(data: any) {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    birthday: data.birthday,
    gender: data.gender,
    email: data.email,
    phone: data.phone,
    address: data.address,
    notes: data.notes,
    class_id: data.classId,
  };
}

/**
 * Student-specific conversion from database format to frontend format
 */
export function studentFromDb(data: any) {
  return {
    _id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    birthday: data.birthday,
    gender: data.gender,
    email: data.email,
    phone: data.phone,
    address: data.address,
    notes: data.notes,
    classId: data.class_id,
    guardians: data.guardians?.map((g: any) => ({
      name: g.name,
      relationship: g.relationship,
      phone: g.phone,
      email: g.email,
      address: g.address,
      isEmergencyContact: g.is_emergency_contact,
    })) || [],
  };
}
