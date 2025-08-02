# Smart Exercise Parameter System

## Overview
The AI now intelligently determines which parameters are needed for each exercise type, only showing relevant fields to doctors and patients.

## Exercise Types and Parameters

### 1. Repetition-Based Exercises (e.g., Push-ups, Squats)
- **Shows**: Sets, Reps, Rest
- **Hides**: Duration
- **Logic**: `sets > 1 AND reps !== null`
- **Example**: 3 sets of 10 push-ups with 30s rest

### 2. Time-Based Exercises (e.g., Plank, Balance holds)
- **Shows**: Duration, (Sets if multiple rounds)
- **Hides**: Reps, (Rest if no rest needed)
- **Logic**: `duration_seconds !== null`
- **Example**: Hold plank for 30 seconds (1 set, no rest)

### 3. Balance/Coordination Exercises (e.g., Single Leg Balance)
- **Shows**: Duration only
- **Hides**: Sets, Reps, Rest
- **Logic**: `sets = 1 AND reps = null AND rest_seconds = 0`
- **Example**: Balance on one leg for 30 seconds

### 4. Cardiovascular Exercises (e.g., Walking, Marching)
- **Shows**: Duration only
- **Hides**: Sets, Reps, Rest
- **Logic**: `sets = 1 AND reps = null AND rest_seconds = 0`
- **Example**: Walk for 5 minutes

### 5. Stretching Exercises
- **Shows**: Duration only
- **Hides**: Sets, Reps, Rest
- **Logic**: `sets = 1 AND reps = null AND rest_seconds = 0`
- **Example**: Hold hamstring stretch for 30 seconds

## Implementation Details

### AI Prompt Enhancement
The Gemini AI now receives detailed instructions about:
- When to use sets vs. single execution
- When exercises need rest periods
- Appropriate parameter combinations for different exercise types

### UI Conditional Display
Both Doctor Dashboard and Patient Layout now use conditional rendering:

```tsx
{/* Only show Sets if the exercise has more than 1 set OR if it has reps */}
{(exercise.sets > 1 || exercise.reps !== null) && (
  <div>Sets: {exercise.sets}</div>
)}

{/* Only show Reps if the exercise has reps (not null) */}
{exercise.reps !== null && (
  <div>Reps: {exercise.reps}</div>
)}

{/* Only show Duration if the exercise has duration (not null) */}
{exercise.duration_seconds !== null && (
  <div>Duration: {exercise.duration_seconds}s</div>
)}

{/* Only show Rest if the exercise has rest time > 0 */}
{exercise.rest_seconds > 0 && (
  <div>Rest: {exercise.rest_seconds}s</div>
)}
```

### Database Schema
Added `rest_seconds` field to exercises table and Exercise interface:
- `rest_seconds: number` - Rest time between sets or repetitions
- Value of 0 means no rest needed (continuous exercises)

## Benefits
1. **Cleaner UI**: No confusing empty or irrelevant fields
2. **Better UX**: Patients see only what they need to track
3. **Accurate Prescriptions**: Doctors get appropriate parameters for each exercise type
4. **Professional Appearance**: Matches real physiotherapy prescription practices

## Example Exercise Configurations

### Strength Exercise (Push-ups)
```json
{
  "name": "Wall Push-ups",
  "sets": 3,
  "reps": 8,
  "duration_seconds": null,
  "rest_seconds": 30
}
```
**Displays**: Sets: 3, Reps: 8, Rest: 30s

### Balance Exercise (Single Leg Stand)
```json
{
  "name": "Single Leg Balance",
  "sets": 1,
  "reps": null,
  "duration_seconds": 30,
  "rest_seconds": 0
}
```
**Displays**: Duration: 30s only

### Cardio Exercise (Walking)
```json
{
  "name": "Gentle Walking",
  "sets": 1,
  "reps": null,
  "duration_seconds": 300,
  "rest_seconds": 0
}
```
**Displays**: Duration: 5 minutes only
