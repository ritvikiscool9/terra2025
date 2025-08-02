-- Sample data for testing the routine creation functionality
-- Run this in your Supabase SQL editor after running the main schema

-- Insert a sample doctor
INSERT INTO doctors (id, email, first_name, last_name, specialization, is_verified) VALUES
('001', 'doctor@example.com', 'John', 'Smith', 'Rehabilitation Medicine', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  specialization = EXCLUDED.specialization,
  is_verified = EXCLUDED.is_verified;

-- Insert sample patients (if they don't exist)
INSERT INTO patients (id, email, first_name, last_name, assigned_doctor_id) VALUES
('11111111-1111-1111-1111-111111111111', 'patient1@example.com', 'Alice', 'Johnson', '001'),
('22222222-2222-2222-2222-222222222222', 'patient2@example.com', 'Bob', 'Williams', '001'),
('33333333-3333-3333-3333-333333333333', 'patient3@example.com', 'Carol', 'Brown', '001'),
('44444444-4444-4444-4444-444444444444', 'patient4@example.com', 'David', 'Davis', '001')
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  assigned_doctor_id = EXCLUDED.assigned_doctor_id;

-- The exercise templates should already exist from the main schema
-- But let's make sure we have some good ones
INSERT INTO exercise_templates (id, name, description, category, difficulty_level, target_body_parts, instructions, precautions, is_public) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Push-ups', 'Basic upper body strengthening exercise', 'strength', 2, ARRAY['chest', 'shoulders', 'triceps'], 'Start in plank position, lower chest to floor, push back up', 'Avoid if you have wrist injuries', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squats', 'Lower body strength and mobility', 'strength', 2, ARRAY['legs', 'glutes'], 'Stand with feet shoulder-width apart, lower down as if sitting, return to standing', 'Keep knees aligned with toes', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Plank', 'Core stability and strength', 'strength', 3, ARRAY['core', 'shoulders'], 'Hold plank position maintaining straight line from head to heels', 'Avoid if you have lower back issues', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Wall Sits', 'Isometric leg strengthening', 'strength', 2, ARRAY['legs', 'glutes'], 'Lean against wall, slide down until thighs parallel to floor, hold', 'Stop if you feel knee pain', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Arm Circles', 'Shoulder mobility warm-up', 'flexibility', 1, ARRAY['shoulders'], 'Extend arms to sides, make small circles gradually increasing size', 'Start with small movements', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty_level = EXCLUDED.difficulty_level,
  target_body_parts = EXCLUDED.target_body_parts,
  instructions = EXCLUDED.instructions,
  precautions = EXCLUDED.precautions,
  is_public = EXCLUDED.is_public;

-- Create a sample routine for testing
INSERT INTO routines (id, patient_id, prescribed_by_doctor_id, title, description, start_date, frequency_per_week, is_active) VALUES
('sample-routine-1', '11111111-1111-1111-1111-111111111111', '001', 'Upper Body Recovery Program', 'Progressive upper body strengthening routine for post-injury recovery', CURRENT_DATE, 3, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  frequency_per_week = EXCLUDED.frequency_per_week,
  is_active = EXCLUDED.is_active;

-- Add exercises to the sample routine
INSERT INTO routine_exercises (routine_id, exercise_template_id, sets, reps, rest_seconds, order_in_routine) VALUES
('sample-routine-1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 10, 60, 1),
('sample-routine-1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, NULL, 30, 2),
('sample-routine-1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, NULL, 60, 3)
ON CONFLICT (routine_id, order_in_routine) DO UPDATE SET
  exercise_template_id = EXCLUDED.exercise_template_id,
  sets = EXCLUDED.sets,
  reps = EXCLUDED.reps,
  rest_seconds = EXCLUDED.rest_seconds;
