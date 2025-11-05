// Auto-generated types for Supabase database schema
// This file provides TypeScript type safety for database operations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      churches: {
        Row: {
          id: string
          name: string
          address: Json
          phone: string | null
          email: string | null
          subscription: 'free' | 'pro' | 'team' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: Json
          phone?: string | null
          email?: string | null
          subscription?: 'free' | 'pro' | 'team' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: Json
          phone?: string | null
          email?: string | null
          subscription?: 'free' | 'pro' | 'team' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          church_id: string
          email: string
          name: string
          role: 'church_admin' | 'admin' | 'teacher'
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          church_id: string
          email: string
          name: string
          role: 'church_admin' | 'admin' | 'teacher'
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          church_id?: string
          email?: string
          name?: string
          role?: 'church_admin' | 'admin' | 'teacher'
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          church_id: string
          name: string
          age_group: string | null
          description: string | null
          schedule: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          church_id: string
          name: string
          age_group?: string | null
          description?: string | null
          schedule?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          church_id?: string
          name?: string
          age_group?: string | null
          description?: string | null
          schedule?: Json
          created_at?: string
          updated_at?: string
        }
      }
      class_teachers: {
        Row: {
          class_id: string
          teacher_id: string
          assigned_at: string
        }
        Insert: {
          class_id: string
          teacher_id: string
          assigned_at?: string
        }
        Update: {
          class_id?: string
          teacher_id?: string
          assigned_at?: string
        }
      }
      students: {
        Row: {
          id: string
          church_id: string
          class_id: string | null
          first_name: string
          last_name: string
          birthday: string | null
          gender: string | null
          email: string | null
          phone: string | null
          address: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          church_id: string
          class_id?: string | null
          first_name: string
          last_name: string
          birthday?: string | null
          gender?: string | null
          email?: string | null
          phone?: string | null
          address?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          church_id?: string
          class_id?: string | null
          first_name?: string
          last_name?: string
          birthday?: string | null
          gender?: string | null
          email?: string | null
          phone?: string | null
          address?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      guardians: {
        Row: {
          id: string
          student_id: string
          name: string
          relationship: string | null
          phone: string | null
          email: string | null
          address: Json
          is_emergency_contact: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          name: string
          relationship?: string | null
          phone?: string | null
          email?: string | null
          address?: Json
          is_emergency_contact?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          name?: string
          relationship?: string | null
          phone?: string | null
          email?: string | null
          address?: Json
          is_emergency_contact?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          class_id: string
          date: string
          present: boolean
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          class_id: string
          date: string
          present: boolean
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          class_id?: string
          date?: string
          present?: boolean
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          church_id: string
          class_id: string | null
          name: string
          description: string | null
          date: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          church_id: string
          class_id?: string | null
          name: string
          description?: string | null
          date: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          church_id?: string
          class_id?: string | null
          name?: string
          description?: string | null
          date?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      test_results: {
        Row: {
          id: string
          test_id: string
          student_id: string
          status: 'passed' | 'failed' | 'absent'
          score: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_id: string
          student_id: string
          status: 'passed' | 'failed' | 'absent'
          score?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          student_id?: string
          status?: 'passed' | 'failed' | 'absent'
          score?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_church_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_church_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_teacher_for_class: {
        Args: { class_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Church = Database['public']['Tables']['churches']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Guardian = Database['public']['Tables']['guardians']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type Test = Database['public']['Tables']['tests']['Row']
export type TestResult = Database['public']['Tables']['test_results']['Row']

export type UserRole = 'church_admin' | 'admin' | 'teacher'
export type TestStatus = 'passed' | 'failed' | 'absent'
export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise'

export interface UserPermissions {
  canManageUsers: boolean
  canManageClasses: boolean
  canEditStudents: boolean
  canTakeAttendance: boolean
  canManageTests: boolean
  canViewReports: boolean
}

// Extended types with relations (for joins)
export interface StudentWithGuardians extends Student {
  guardians?: Guardian[]
}

export interface StudentWithAttendance extends Student {
  attendance?: Attendance[]
}

export interface ClassWithTeachers extends Class {
  teachers?: User[]
}

export interface TestWithResults extends Test {
  test_results?: TestResult[]
}
