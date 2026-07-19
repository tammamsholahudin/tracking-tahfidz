import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Database = {
  public: {
    Tables: {
      teachers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          photo_url: string | null
          role: 'admin' | 'guru'
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['teachers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['teachers']['Insert']>
      }
      students: {
        Row: {
          id: string
          nis: string
          name: string
          photo_url: string | null
          gender: 'L' | 'P'
          birth_date: string | null
          address: string | null
          parent_name: string | null
          parent_phone: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      surahs: {
        Row: {
          id: number
          number: number
          name_arabic: string
          name_latin: string
          name_indonesian: string
          total_verses: number
          revelation_type: 'Makkiyah' | 'Madaniyah'
        }
      }
      school_classes: {
        Row: {
          id: string
          name: string
          teacher_id: string
          academic_year_id: string
          semester_id: string
          total_students: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['school_classes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['school_classes']['Insert']>
      }
      lesson_groups: {
        Row: {
          id: string
          name: string
          teacher_id: string
          schedule_day: string | null
          schedule_time: string | null
          location: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['lesson_groups']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['lesson_groups']['Insert']>
      }
      private_students: {
        Row: {
          id: string
          student_id: string
          teacher_id: string
          schedule_day: string | null
          schedule_time: string | null
          monthly_fee: number | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['private_students']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['private_students']['Insert']>
      }
      attendance: {
        Row: {
          id: string
          meeting_id: string
          student_id: string
          status: 'hadir' | 'izin' | 'sakit' | 'alpa'
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>
      }
      meetings: {
        Row: {
          id: string
          class_id: string
          class_type: 'school' | 'lesson' | 'private'
          meeting_number: number
          date: string
          status: string
          status_note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['meetings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>
      }
      memorization_records: {
        Row: {
          id: string
          student_id: string
          meeting_id: string
          teacher_id: string
          surah_id: number
          verse_start: number
          verse_end: number
          status: 'lancar' | 'cukup_lancar' | 'perlu_murojaah' | 'belum_lancar'
          score: number
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['memorization_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['memorization_records']['Insert']>
      }
      targets: {
        Row: {
          id: string
          class_id: string
          class_type: 'school' | 'lesson' | 'private'
          surah_id: number
          verse_start: number | null
          verse_end: number | null
          order_index: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['targets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['targets']['Insert']>
      }
      payments: {
        Row: {
          id: string
          student_id: string
          class_id: string
          class_type: 'lesson' | 'private'
          period_month: number
          period_year: number
          status: 'paid' | 'unpaid'
          paid_at: string | null
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      academic_years: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
      }
      semesters: {
        Row: {
          id: string
          academic_year_id: string
          name: string
          semester_number: 1 | 2
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
      }
    }
  }
}
