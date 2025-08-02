import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Doctor {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  medical_license?: string
  specialization?: string
  hospital_affiliation?: string
  phone?: string
  profile_image_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  date_of_birth?: string
  phone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_conditions?: string[]
  current_medications?: string[]
  nft_wallet_address?: string // Updated to match the database column name
  profile_image_url?: string
  assigned_doctor_id?: string
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  name: string
  description?: string
  category?: string
  difficulty_level?: number
  default_sets?: number
  default_reps?: number
  default_duration_seconds?: number
  instructions?: string
  video_demo_url?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Routine {
  id: string
  patient_id: string
  prescribed_by_doctor_id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  frequency_per_week: number
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface ExerciseCompletion {
  id: string
  routine_exercise_id: string
  patient_id: string
  video_url?: string
  ai_analysis_result?: any
  form_score?: number
  completion_status: 'completed' | 'needs_improvement' | 'failed'
  actual_sets?: number
  actual_reps?: number
  actual_duration_seconds?: number
  completion_date: string
  doctor_feedback?: string
  nft_minted: boolean
  nft_token_id?: string
  created_at: string
}
