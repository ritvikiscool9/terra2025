import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key (bypasses RLS)
// Only create this on the server side where the environment variable is available
export const supabaseAdmin = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

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
  rest_seconds?: number
  instructions?: string
  video_demo_url?: string
  image_url?: string
  equipment_needed?: string
  muscle_groups?: string[]
  safety_notes?: string
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

export interface RoutineExercise {
  id: string
  routine_id: string
  exercise_id: string
  sets: number
  reps?: number
  duration_seconds?: number
  rest_seconds?: number
  order_in_routine: number
  notes?: string
  created_at: string
  exercises?: Exercise // For joined queries
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

export interface NFT {
  id: string
  patient_id: string
  exercise_completion_id: string
  name: string
  description: string
  image_url: string
  token_id?: string
  contract_address: string
  wallet_address: string
  transaction_hash?: string
  block_number?: number
  exercise_type: string
  completion_score?: number
  difficulty_level?: string
  body_part?: string
  rarity?: string
  minted: boolean
  minted_at?: string
  ai_generated: boolean
  image_prompt?: string
  generation_model?: string
  attributes?: any
  metadata_uri?: string
  viewed_by_patient: boolean
  viewed_by_doctor: boolean
  created_at: string
  updated_at: string
}
