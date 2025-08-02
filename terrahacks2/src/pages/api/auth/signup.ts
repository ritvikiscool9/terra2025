import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, firstName, lastName, userType, additionalData } = req.body

  if (!email || !password || !firstName || !lastName || !userType) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!['doctor', 'patient'].includes(userType)) {
    return res.status(400).json({ error: 'Invalid user type' })
  }

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: userType
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return res.status(400).json({ error: authError.message })
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' })
    }

    // Create profile in appropriate table
    if (userType === 'doctor') {
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          medical_license: additionalData?.medicalLicense || null,
          specialization: additionalData?.specialization || null,
          hospital_affiliation: additionalData?.hospitalAffiliation || null,
          phone: additionalData?.phone || null,
          is_verified: false
        })

      if (doctorError) {
        console.error('Doctor profile error:', doctorError)
        return res.status(400).json({ error: 'Failed to create doctor profile' })
      }
    } else {
      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: additionalData?.dateOfBirth || null,
          phone: additionalData?.phone || null,
          emergency_contact_name: additionalData?.emergencyContactName || null,
          emergency_contact_phone: additionalData?.emergencyContactPhone || null,
          nft_wallet_address: additionalData?.walletAddress || null,
          medical_conditions: additionalData?.medicalConditions || null,
          current_medications: additionalData?.currentMedications || null
        })

      if (patientError) {
        console.error('Patient profile error:', patientError)
        return res.status(400).json({ error: 'Failed to create patient profile' })
      }
    }

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        userType
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
