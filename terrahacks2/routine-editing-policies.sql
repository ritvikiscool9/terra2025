-- Routine Editing Policies
-- This file contains the additional policies needed for doctors to edit workout routines
-- Run this after your main schema has been set up

-- Drop existing routine-related policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Doctors can update routines they prescribed" ON public.routines;
DROP POLICY IF EXISTS "Doctors can view routine exercises" ON public.routine_exercises;
DROP POLICY IF EXISTS "Doctors can insert routine exercises" ON public.routine_exercises;
DROP POLICY IF EXISTS "Doctors can update routine exercises" ON public.routine_exercises;
DROP POLICY IF EXISTS "Doctors can delete routine exercises" ON public.routine_exercises;
DROP POLICY IF EXISTS "Patients can view their routine exercises" ON public.routine_exercises;

-- Allow doctors to update routines they prescribed
CREATE POLICY "Doctors can update routines they prescribed" ON public.routines
  FOR UPDATE USING (
    prescribed_by_doctor_id IN (
      SELECT id FROM public.doctors WHERE user_id = auth.uid()
    )
  );

-- Allow doctors to view routine exercises for routines they prescribed
CREATE POLICY "Doctors can view routine exercises" ON public.routine_exercises
  FOR SELECT USING (
    routine_id IN (
      SELECT r.id FROM public.routines r
      INNER JOIN public.doctors d ON r.prescribed_by_doctor_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Allow doctors to insert routine exercises for routines they prescribed
CREATE POLICY "Doctors can insert routine exercises" ON public.routine_exercises
  FOR INSERT WITH CHECK (
    routine_id IN (
      SELECT r.id FROM public.routines r
      INNER JOIN public.doctors d ON r.prescribed_by_doctor_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Allow doctors to update routine exercises for routines they prescribed
CREATE POLICY "Doctors can update routine exercises" ON public.routine_exercises
  FOR UPDATE USING (
    routine_id IN (
      SELECT r.id FROM public.routines r
      INNER JOIN public.doctors d ON r.prescribed_by_doctor_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Allow doctors to delete routine exercises for routines they prescribed
CREATE POLICY "Doctors can delete routine exercises" ON public.routine_exercises
  FOR DELETE USING (
    routine_id IN (
      SELECT r.id FROM public.routines r
      INNER JOIN public.doctors d ON r.prescribed_by_doctor_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Allow patients to view their routine exercises
CREATE POLICY "Patients can view their routine exercises" ON public.routine_exercises
  FOR SELECT USING (
    routine_id IN (
      SELECT r.id FROM public.routines r
      INNER JOIN public.patients p ON r.patient_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
