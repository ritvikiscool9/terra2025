-- Create exercise_completions table to track patient progress
CREATE TABLE IF NOT EXISTS exercise_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  routine_exercise_id UUID NOT NULL REFERENCES routine_exercises(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_feedback TEXT,
  pass_status BOOLEAN DEFAULT TRUE,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_completions_patient_id ON exercise_completions(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_routine_id ON exercise_completions(routine_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_completed_at ON exercise_completions(completed_at);

-- Create unique constraint to prevent duplicate completions
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_completions_unique 
ON exercise_completions(patient_id, routine_exercise_id);

-- Add RLS policies
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own completions
CREATE POLICY "Patients can view own exercise completions" ON exercise_completions
  FOR SELECT USING (auth.uid()::text = patient_id::text);

-- Patients can insert their own completions
CREATE POLICY "Patients can insert own exercise completions" ON exercise_completions
  FOR INSERT WITH CHECK (auth.uid()::text = patient_id::text);

-- Patients can update their own completions
CREATE POLICY "Patients can update own exercise completions" ON exercise_completions
  FOR UPDATE USING (auth.uid()::text = patient_id::text);

-- Doctors can view completions for their patients
CREATE POLICY "Doctors can view patient exercise completions" ON exercise_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = exercise_completions.patient_id 
      AND patients.assigned_doctor_id::text = auth.uid()::text
    )
  );
