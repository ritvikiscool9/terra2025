

-- Allow doctors to update their assigned patients' medical information
DROP POLICY IF EXISTS "Doctors can update assigned patients" ON public.patients;
CREATE POLICY "Doctors can update assigned patients" ON public.patients
  FOR UPDATE USING (
    assigned_doctor_id IN (
      SELECT id FROM public.doctors WHERE user_id = auth.uid()
    )
  );
