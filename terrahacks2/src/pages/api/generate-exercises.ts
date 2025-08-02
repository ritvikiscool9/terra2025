import { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { patientConditions, patientName } = req.body

  if (!patientConditions || patientConditions.length === 0) {
    return res.status(400).json({ error: 'Patient medical conditions are required' })
  }

  try {
    const prompt = `
This is a physiotherapy rehabilitation application designed to help patients recover from injuries and medical conditions through targeted exercises.

As a professional physical therapist, I need you to generate 5 specific rehabilitation exercises for a patient with the following medical conditions: ${patientConditions.join(', ')}.

For each exercise, provide:
1. Exercise name (concise, professional)
2. Brief description (1-2 sentences)
3. Category (upper_body, lower_body, core, or cardio)
4. Difficulty level (1-5, where 1 is easiest)
5. Default sets (1-5)
6. Default reps (if applicable, null if time-based)
7. Default duration in seconds (if applicable, null if rep-based)
8. Clear instructions (step-by-step, 2-3 sentences)

Focus on exercises that are:
- Safe and appropriate for the patient's conditions
- Progressive and therapeutic
- Can be done at home with minimal equipment
- Specifically target the affected areas or compensatory movements

Format your response as a JSON array with this exact structure:
[
  {
    "name": "Exercise Name",
    "description": "Brief description of the exercise",
    "category": "upper_body|lower_body|core|cardio",
    "difficulty_level": 1-5,
    "default_sets": 1-5,
    "default_reps": number or null,
    "default_duration_seconds": number or null,
    "instructions": "Step-by-step instructions"
  }
]

Ensure the JSON is valid and properly formatted.`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })
    
    if (!response || !response.text) {
      throw new Error('No response received from Gemini AI')
    }
    
    const text = response.text

    // Try to extract JSON from the response
    let exercises
    try {
      // Look for JSON array in the response
      const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/)
      if (jsonMatch) {
        exercises = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      console.log('Raw response:', text)
      
      // Fallback: create a default set of exercises
      exercises = [
        {
          name: "Gentle Range of Motion",
          description: "Basic movement to maintain joint flexibility",
          category: "upper_body",
          difficulty_level: 1,
          default_sets: 2,
          default_reps: 10,
          default_duration_seconds: null,
          instructions: "Move the affected joint slowly through its comfortable range of motion. Hold briefly at each end."
        },
        {
          name: "Breathing Exercise",
          description: "Deep breathing to promote relaxation and core engagement",
          category: "core",
          difficulty_level: 1,
          default_sets: 3,
          default_reps: null,
          default_duration_seconds: 60,
          instructions: "Breathe in slowly through your nose for 4 counts, hold for 2 counts, exhale through mouth for 6 counts."
        },
        {
          name: "Gentle Stretching",
          description: "Light stretching for affected muscle groups",
          category: "lower_body",
          difficulty_level: 2,
          default_sets: 2,
          default_reps: null,
          default_duration_seconds: 30,
          instructions: "Hold each stretch gently without bouncing. You should feel a mild stretch, not pain."
        },
        {
          name: "Isometric Hold",
          description: "Muscle activation without joint movement",
          category: "core",
          difficulty_level: 2,
          default_sets: 3,
          default_reps: null,
          default_duration_seconds: 10,
          instructions: "Contract the target muscles and hold the position without moving. Breathe normally during the hold."
        },
        {
          name: "Light Walking",
          description: "Low-impact cardiovascular exercise",
          category: "cardio",
          difficulty_level: 1,
          default_sets: 1,
          default_reps: null,
          default_duration_seconds: 300,
          instructions: "Walk at a comfortable pace. Stop if you experience any pain or discomfort."
        }
      ]
    }

    // Validate the exercises structure
    if (!Array.isArray(exercises) || exercises.length === 0) {
      throw new Error('Invalid exercises format received from AI')
    }

    // Ensure each exercise has required fields
    const validatedExercises = exercises.map((exercise, index) => ({
      id: `ai-generated-${Date.now()}-${index}`, // Generate a unique ID
      name: exercise.name || `Exercise ${index + 1}`,
      description: exercise.description || 'AI-generated rehabilitation exercise',
      category: exercise.category || 'core',
      difficulty_level: Math.max(1, Math.min(5, exercise.difficulty_level || 1)),
      default_sets: Math.max(1, Math.min(5, exercise.default_sets || 3)),
      default_reps: exercise.default_reps,
      default_duration_seconds: exercise.default_duration_seconds,
      instructions: exercise.instructions || 'Follow your physical therapist\'s guidance for proper form.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    res.status(200).json({
      exercises: validatedExercises,
      patientConditions,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating exercises with Gemini:', error)
    res.status(500).json({ 
      error: 'Failed to generate personalized exercises',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
