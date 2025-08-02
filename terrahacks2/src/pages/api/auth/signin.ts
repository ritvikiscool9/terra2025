import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Auth error:', authError)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!authData.user) {
      return res.status(401).json({ error: 'Authentication failed' })
    }

    // Check if user is a doctor or patient
    const { data: doctorData } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    let userType = null
    let profile = null

    if (doctorData) {
      userType = 'doctor'
      profile = doctorData
    } else if (patientData) {
      userType = 'patient'
      profile = patientData
    }

    if (!userType || !profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        userType,
        profile,
        session: authData.session
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
