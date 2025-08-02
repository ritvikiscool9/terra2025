import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Insert sample doctor
    const { data: existingDoctors, error: doctorCheckError } = await supabase
      .from('doctors')
      .select('id')
      .limit(1);

    if (doctorCheckError) {
      throw doctorCheckError;
    }

    let doctorId;
    if (!existingDoctors || existingDoctors.length === 0) {
      const { data: newDoctor, error: doctorInsertError } = await supabase
        .from('doctors')
        .insert({
          email: 'dr.sarah.johnson@hospital.com',
          first_name: 'Sarah',
          last_name: 'Johnson',
          medical_license: 'MD123456789',
          specialization: 'Orthopedic Specialist',
          hospital_affiliation: 'City General Hospital',
          phone: '+1-555-0101',
          is_verified: true
        })
        .select('id')
        .single();

      if (doctorInsertError) {
        throw doctorInsertError;
      }
      doctorId = newDoctor.id;
    } else {
      doctorId = existingDoctors[0].id;
    }

    // Insert sample patient
    const { data: existingPatients, error: patientCheckError } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (patientCheckError) {
      throw patientCheckError;
    }

    if (!existingPatients || existingPatients.length === 0) {
      const { error: patientInsertError } = await supabase
        .from('patients')
        .insert({
          email: 'john.smith@email.com',
          first_name: 'John',
          last_name: 'Smith',
          date_of_birth: '1985-01-15',
          phone: '+1-555-4567',
          emergency_contact_name: 'Jane Smith',
          emergency_contact_phone: '+1-555-4568',
          medical_conditions: ['Shoulder Impingement', 'Lower Back Pain'],
          current_medications: ['Ibuprofen 200mg', 'Physical Therapy'],
          nft_wallet_address: '0x742d35Cc6Bf8f8...d6d6BB88',
          assigned_doctor_id: doctorId
        });

      if (patientInsertError) {
        throw patientInsertError;
      }
    }

    res.status(200).json({ 
      message: 'Sample data setup completed successfully',
      doctorId 
    });

  } catch (error) {
    console.error('Error setting up sample data:', error);
    res.status(500).json({ 
      message: 'Error setting up sample data', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
