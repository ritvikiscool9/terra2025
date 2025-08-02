-- Sample data for testing the RehabTrack application
-- Run this after creating the main schema

-- Sample doctors
INSERT INTO public.doctors (email, first_name, last_name, medical_license, specialization, hospital_affiliation, phone, is_verified) 
VALUES 
  ('dr.smith@hospital.com', 'Sarah', 'Smith', 'MD123456', 'Physical Therapy', 'City General Hospital', '+1-555-0101', true),
  ('dr.johnson@clinic.com', 'Michael', 'Johnson', 'MD789012', 'Orthopedic Surgery', 'Sports Medicine Clinic', '+1-555-0102', true),
  ('dr.williams@rehab.com', 'Emily', 'Williams', 'MD345678', 'Rehabilitation Medicine', 'Rehab Center Plus', '+1-555-0103', false)
ON CONFLICT (email) DO NOTHING;

-- Sample patients (with NFT wallet addresses)
INSERT INTO public.patients (email, first_name, last_name, date_of_birth, phone, nft_wallet_address, medical_conditions, current_medications, emergency_contact_name, emergency_contact_phone)
VALUES 
  ('patient1@email.com', 'John', 'Doe', '1985-06-15', '+1-555-0201', '0x742d35Cc6634C0532925a3b8D404fddF2FaaE336', 
   ARRAY['Lower back pain', 'Mild arthritis'], ARRAY['Ibuprofen 400mg'], 'Jane Doe', '+1-555-0202'),
  ('patient2@email.com', 'Maria', 'Garcia', '1992-03-22', '+1-555-0203', '0x8ba1f109551bD432803012645Hac136c13db896A',
   ARRAY['Knee injury recovery'], ARRAY['Physical therapy supplements'], 'Carlos Garcia', '+1-555-0204'),
  ('patient3@email.com', 'David', 'Chen', '1978-11-08', '+1-555-0205', '0x1234567890123456789012345678901234567890',
   ARRAY['Shoulder impingement'], NULL, 'Lisa Chen', '+1-555-0206')
ON CONFLICT (email) DO NOTHING;

-- Assign patients to doctors (you'll need to update with actual IDs after users are created)
-- This would typically be done through the application interface

-- Sample routine for testing (you'll need to update with actual patient and doctor IDs)
-- INSERT INTO public.routines (patient_id, prescribed_by_doctor_id, title, description, start_date, frequency_per_week, notes)
-- VALUES 
--   ((SELECT id FROM patients WHERE email = 'patient1@email.com'), 
--    (SELECT id FROM doctors WHERE email = 'dr.smith@hospital.com'),
--    'Lower Back Recovery Program', 
--    'Progressive exercises to strengthen lower back and core muscles',
--    CURRENT_DATE,
--    3,
--    'Start with lighter weights and gradually increase intensity');

-- The above INSERT would be handled by your application after proper user authentication is set up
