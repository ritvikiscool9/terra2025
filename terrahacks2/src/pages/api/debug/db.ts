import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test database connection by trying to fetch from a table
    const { data, error } = await supabase
      .from('exercises')
      .select('count')
      .limit(1)

    if (error) {
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: error.message 
      })
    }

    res.status(200).json({
      message: 'Database connection successful',
      tablesExist: data !== null
    })
  } catch (error) {
    res.status(500).json({
      error: 'Database test failed',
      details: error
    })
  }
}
