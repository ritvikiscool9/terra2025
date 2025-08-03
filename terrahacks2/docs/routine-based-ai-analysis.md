# Routine-Based AI Analysis Implementation

## Overview
Enhanced the VideoAnalyzer component to support routine-based workflow where users must select a routine before uploading workout videos, with AI analysis based on specific routine exercises and NFT rewards when all exercises are completed.

## Key Features Implemented

### 1. Routine-Based Exercise Tracking
- **Exercise Completion State**: Track which exercises in a routine have been completed
- **Progress Visualization**: Display routine progress with visual indicators
- **Current Exercise Highlighting**: Show which exercise is currently being performed

### 2. Enhanced AI Analysis
- **Routine Context**: AI now understands the broader routine context
- **Individual Exercise Evaluation**: Each exercise is analyzed against its specific guidelines
- **Structured Feedback**: AI provides targeted feedback for each exercise within the routine

### 3. NFT Reward System
- **Completion Detection**: Automatically detect when all exercises in a routine are completed
- **NFT Button**: Show "Claim NFT" button when routine is fully completed
- **Reward Minting**: Mint NFT rewards for completing entire routines

## Implementation Details

### VideoAnalyzer Component (`/src/components/VideoAnalyzer.tsx`)

#### New State Variables
```typescript
// Routine-based exercise tracking
const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
const [exerciseCompletions, setExerciseCompletions] = useState<{[key: string]: boolean}>({});
const [showNFTButton, setShowNFTButton] = useState(false);
const [isMintingNFT, setIsMintingNFT] = useState(false);
```

#### Enhanced Exercise Context Interface
```typescript
interface ExerciseContext {
  name?: string;
  description?: string;
  instructions?: string;
  category?: string;
  difficulty_level?: number;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  routine?: {
    title: string;
    description?: string;
    exercises?: RoutineExercise[];
  };
}

interface RoutineExercise {
  id: string;
  exercise_id: string;
  order_in_routine: number;
  sets: number;
  reps?: number;
  duration_seconds?: number;
  exercises?: {
    name: string;
    description?: string;
    instructions?: string;
    category?: string;
    difficulty_level?: number;
  };
  completed?: boolean;
}
```

#### Key Functions

**Exercise Completion Tracking**
```typescript
const checkRoutineCompletion = () => {
  if (!exerciseContext?.routine?.exercises) return false;
  
  const totalExercises = exerciseContext.routine.exercises.length;
  const completedCount = Object.values(exerciseCompletions).filter(Boolean).length;
  
  return completedCount === totalExercises;
};
```

**Enhanced Video Analysis**
- Marks exercises as completed after successful analysis
- Tracks completion state per exercise name
- Automatically shows NFT button when all exercises are done

**NFT Reward Minting**
```typescript
const mintNFTReward = async () => {
  // Mints NFT using the existing generate-and-mint API
  // Uses routine title as exercise type
  // Provides good completion score for finishing all exercises
};
```

### Routine Progress Display

#### Visual Components
- **Exercise List**: Shows all exercises in routine with completion status
- **Progress Bar**: Displays completion percentage
- **Status Indicators**: 
  - ⏳ Pending exercises
  - 🎯 Current exercise  
  - ✅ Completed exercises
- **NFT Button**: Appears when all exercises are completed

#### Status Colors
- **Current Exercise**: Blue border and background (`#dbeafe`, `#3b82f6`)
- **Completed Exercise**: Green border and background (`#d1fae5`, `#10b981`)
- **Pending Exercise**: Gray border and background (`#f9fafb`, `#e5e7eb`)

### API Enhancement (`/src/pages/api/analyze-video.ts`)

#### Updated Request Interface
```typescript
interface RequestBody {
  videoBase64: string;
  mimeType?: string;
  exerciseContext?: {
    name?: string;
    description?: string;
    instructions?: string;
    category?: string;
    difficulty_level?: number;
    sets?: number;
    reps?: number;
    duration_seconds?: number;
    routine?: {
      title: string;
      description?: string;
      exercises?: any[];
    };
  };
}
```

#### Enhanced Analysis Prompt
- Includes routine context in AI analysis
- Provides broader rehabilitation program context
- More targeted feedback for structured programs

## User Workflow

### 1. Routine Selection
1. Patient navigates to "My Routines"
2. Selects a routine from their assigned routines
3. Views routine details and exercises

### 2. Exercise Execution
1. Patient clicks "Start Workout" for selected routine
2. VideoAnalyzer shows routine progress display
3. Patient records/uploads video for current exercise
4. AI analyzes video and provides feedback
5. Exercise is marked as completed

### 3. Progress Tracking
1. Routine progress display updates in real-time
2. Completed exercises show green checkmarks
3. Current exercise is highlighted in blue
4. Progress percentage updates automatically

### 4. NFT Reward
1. When all exercises are completed, NFT button appears
2. Patient clicks "Claim NFT" button
3. NFT is minted with routine information
4. Success message confirms NFT creation
5. Progress resets for next session

## Benefits

### For Patients
- **Clear Progress Tracking**: Visual feedback on routine completion
- **Structured Workflow**: Guided exercise progression
- **Motivation**: NFT rewards for completing routines
- **Better AI Feedback**: Context-aware exercise analysis

### For Healthcare Providers
- **Comprehensive Tracking**: Monitor patient progress through entire routines
- **Better Compliance**: Structured approach encourages completion
- **Detailed Analytics**: NFT data shows routine completion rates
- **Flexible Programs**: Can create multi-exercise rehabilitation programs

## Technical Architecture

### State Management
- Exercise completion state managed in VideoAnalyzer
- Local state persists during session
- Resets after NFT claim or page refresh

### Data Flow
1. PatientLayout passes routine context to VideoAnalyzer
2. VideoAnalyzer tracks exercise completions locally
3. AI analysis includes routine context
4. NFT minting uses routine title and completion data

### Integration Points
- **Supabase Database**: Routine and exercise data
- **NFT System**: Reward minting for routine completion
- **AI Analysis**: Context-aware video feedback
- **Patient Dashboard**: Routine selection and progress

## Future Enhancements

### Potential Improvements
1. **Persistent Progress**: Save completion state to database
2. **Session Tracking**: Multiple sessions for long routines
3. **Adaptive Difficulty**: Adjust based on performance
4. **Social Features**: Share routine completion achievements
5. **Analytics Dashboard**: Detailed progress metrics for doctors

### Scalability Considerations
- Could support multi-day routine programs
- Flexible exercise ordering and dependencies
- Custom routine creation by healthcare providers
- Integration with wearable device data

## Conclusion

The routine-based AI analysis workflow provides a structured, engaging, and rewarding experience for patients while giving healthcare providers better tools for monitoring rehabilitation progress. The integration of NFT rewards adds a gamification element that encourages completion and provides verifiable achievement records.
