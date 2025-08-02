-- Test query to check if sample data exists and routine creation works
-- You can run these in your Supabase SQL editor to verify the setup

-- Check if doctors exist
SELECT * FROM public.doctors;

-- Check if patients exist  
SELECT * FROM public.patients;

-- Check if exercises exist
SELECT * FROM public.exercises LIMIT 5;

-- Check if any routines exist
SELECT 
  r.*,
  p.first_name as patient_name,
  p.last_name as patient_lastname,
  d.first_name as doctor_name,
  d.last_name as doctor_lastname
FROM public.routines r
JOIN public.patients p ON r.patient_id = p.id
JOIN public.doctors d ON r.prescribed_by_doctor_id = d.id;

-- Check routine exercises if any routines exist
SELECT 
  re.*,
  e.name as exercise_name,
  r.title as routine_title
FROM public.routine_exercises re
JOIN public.exercises e ON re.exercise_id = e.id
JOIN public.routines r ON re.routine_id = r.id;
