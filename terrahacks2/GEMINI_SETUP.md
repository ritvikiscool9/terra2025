# Environment Variables for Gemini AI Integration

Add the following environment variable to your `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## How to get a Gemini API Key:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key and add it to your `.env.local` file

## How the AI Exercise Generation Works:

1. When a doctor selects a patient in the "Create Routine" modal
2. The system sends the patient's medical conditions to the Gemini AI API
3. Gemini generates 5 personalized rehabilitation exercises based on:
   - The patient's specific medical conditions
   - Safe, home-based exercises
   - Progressive difficulty
   - Professional physical therapy guidelines
4. The exercises are displayed in the "Available Exercises" section
5. The doctor can then add these personalized exercises to the routine

## Features:

- **Personalized**: Exercises are tailored to each patient's medical conditions
- **Professional**: Generated using physical therapy best practices
- **Safe**: Focuses on appropriate exercises for the patient's condition
- **Fallback**: If AI fails, falls back to default exercises
- **Loading States**: Shows loading spinner while generating exercises
