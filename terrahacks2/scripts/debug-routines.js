// Debug script to test routine creation and exercise fetching
// This is a standalone test you can run to debug the issue

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugRoutines() {
  console.log('=== DEBUGGING ROUTINES ===')
  
  // 1. Check if exercises exist
  console.log('\n1. Checking exercises table:')
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('*')
    .limit(5)
  
  if (exercisesError) {
    console.error('Error fetching exercises:', exercisesError)
  } else {
    console.log('Found exercises:', exercises?.length)
    exercises?.forEach(ex => console.log(`  - ${ex.name} (ID: ${ex.id})`))
  }

  // 2. Check if routines exist
  console.log('\n2. Checking routines table:')
  const { data: routines, error: routinesError } = await supabase
    .from('routines')
    .select('*')
    .limit(5)
    
  if (routinesError) {
    console.error('Error fetching routines:', routinesError)
  } else {
    console.log('Found routines:', routines?.length)
    routines?.forEach(r => console.log(`  - ${r.title} (ID: ${r.id})`))
  }

  // 3. Check routine_exercises
  console.log('\n3. Checking routine_exercises table:')
  const { data: routineExercises, error: routineExercisesError } = await supabase
    .from('routine_exercises')
    .select('*')
    .limit(5)
    
  if (routineExercisesError) {
    console.error('Error fetching routine_exercises:', routineExercisesError)
  } else {
    console.log('Found routine_exercises:', routineExercises?.length)
    routineExercises?.forEach(re => console.log(`  - Routine: ${re.routine_id}, Exercise: ${re.exercise_id}, Sets: ${re.sets}`))
  }

  // 4. Test the join query
  if (routines && routines.length > 0) {
    console.log('\n4. Testing join query for first routine:')
    const firstRoutineId = routines[0].id
    
    const { data: joinedData, error: joinError } = await supabase
      .from('routine_exercises')
      .select(`
        *,
        exercises(name, description, instructions, category, difficulty_level)
      `)
      .eq('routine_id', firstRoutineId)
      .order('order_in_routine')

    if (joinError) {
      console.error('Join query error:', joinError)
    } else {
      console.log('Join query result:', JSON.stringify(joinedData, null, 2))
    }
  }
}

debugRoutines().catch(console.error)
