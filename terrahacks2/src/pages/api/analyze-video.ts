import { NextApiRequest, NextApiResponse } from 'next';

// Note: You'll need to install the Google AI Gemini package:
// npm install @google/generative-ai

import { GoogleGenerativeAI } from '@google/generative-ai';

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

interface ResponseData {
  analysis?: string;
  error?: string;
}

// Helper function to detect MIME type from base64 data
function getMimeTypeFromBase64(base64: string): string {
  // Check the first few bytes to determine file type
  const firstBytes = base64.substring(0, 20);
  
  // Convert base64 to binary for header checking
  try {
    const binaryString = atob(firstBytes);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Check for common video file signatures
    const header = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (header.includes('667479706d703432') || header.includes('667479706d703431')) {
      return 'video/mp4';
    } else if (header.includes('667479707174') || header.includes('6d6f6f76')) {
      return 'video/quicktime'; // .mov files
    } else if (header.includes('525249464')) {
      return 'video/avi';
    } else if (header.includes('1a45dfa3')) {
      return 'video/webm';
    }
  } catch (e) {
    console.warn('Could not detect MIME type from base64 header, defaulting to mp4');
  }
  
  // Default to mp4 if detection fails
  return 'video/mp4';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Parse request body
    const { videoBase64, mimeType, exerciseContext }: RequestBody = req.body;
    if (!videoBase64) {
      return res.status(400).json({ error: 'videoBase64 is required' });
    }

    // Detect MIME type if not provided
    const detectedMimeType = mimeType || getMimeTypeFromBase64(videoBase64);
    
    // Convert base64 to buffer
    const videoBuffer = Buffer.from(videoBase64, 'base64');
    
    console.log('===============================');
    console.log('🎬 VIDEO ANALYSIS REQUEST');
    console.log('Video size (bytes):', videoBuffer.length);
    console.log('Video size (MB):', (videoBuffer.length / 1024 / 1024).toFixed(2));
    console.log('Detected MIME type:', detectedMimeType);
    console.log('Exercise context received:', JSON.stringify(exerciseContext, null, 2));
    console.log('Exercise name:', exerciseContext?.name || 'NO EXERCISE NAME PROVIDED');
    console.log('Target parameters:');
    if (exerciseContext?.sets) console.log('  - Sets:', exerciseContext.sets);
    if (exerciseContext?.reps) console.log('  - Reps:', exerciseContext.reps);
    if (exerciseContext?.duration_seconds) console.log('  - Duration:', exerciseContext.duration_seconds, 'seconds');
    console.log('🚨 AI BIAS CHECK: The AI should count reps objectively, NOT be influenced by these targets!');
    console.log('===============================');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try gemini-2.0-flash-exp first for better video understanding and rep counting
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent analysis
          topP: 0.8,
          topK: 40,
        }
      });
      console.log('Using gemini-2.0-flash-exp model');
    } catch (error) {
      console.log('Failed to initialize gemini-2.0-flash-exp, falling back to gemini-1.5-flash');
      model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
        }
      });
    }

    // Create context-aware prompt
    let contextPrompt = '';
    if (exerciseContext?.name) {
      const routineInfo = exerciseContext.routine ? 
        `\n**ROUTINE CONTEXT:**
This exercise is part of: "${exerciseContext.routine.title}"
${exerciseContext.routine.description ? `Routine Goal: ${exerciseContext.routine.description}` : ''}
Patient is working through a structured rehabilitation program.
` : '';

      contextPrompt = `**EXERCISE CONTEXT:**
The user is performing: "${exerciseContext.name}"
${exerciseContext.description ? `Description: ${exerciseContext.description}` : ''}
${exerciseContext.instructions ? `Instructions: ${exerciseContext.instructions}` : ''}
${exerciseContext.category ? `Category: ${exerciseContext.category}` : ''}
${exerciseContext.difficulty_level ? `Difficulty Level: ${exerciseContext.difficulty_level}` : ''}
${exerciseContext.sets ? `Target Sets: ${exerciseContext.sets}` : ''}
${exerciseContext.reps ? `Target Reps: ${exerciseContext.reps}` : ''}
${exerciseContext.duration_seconds ? `Target Duration: ${exerciseContext.duration_seconds} seconds` : ''}
${routineInfo}

⚠️ IMPORTANT: Count reps objectively based on what you see, NOT influenced by the target numbers above!

`;
    }

    // Create the prompt with video and text parts
    const prompt = [
      {
        inlineData: {
          data: videoBase64,
          mimeType: detectedMimeType
        }
      },
      {
        text: `${contextPrompt}As a supportive physical therapy AI assistant, analyze this exercise video objectively and provide encouraging but honest feedback.

${exerciseContext?.name ? `The patient was supposed to perform: "${exerciseContext.name}"

CRITICAL ANALYSIS INSTRUCTIONS:
1. Watch the COMPLETE video from start to finish WITHOUT bias toward the target numbers
2. Count repetitions OBJECTIVELY - ignore the target rep count while counting
3. A repetition = one complete movement cycle (e.g., up-down for squats, rotation cycle for pronation/supination)
4. Be GENEROUS with form assessment - focus on effort and safety rather than perfect technique
5. Only fail if there are serious safety concerns or they did completely wrong exercise

COUNTING GUIDELINES:
- Count EVERY visible repetition attempt, even if form isn't perfect
- For pronation/supination: Count each complete rotation cycle (palm up to palm down and back)
- For squats/lunges: Count each complete up-down movement
- Be generous with partial reps if they show good effort
- If you're unsure between two numbers, choose the higher count

Please provide feedback in this EXACT format:

**🎯 Exercise Evaluation: [✅ PASS or ❌ FAIL]**

**Video Analysis:**
- Total Video Duration: [X] seconds
- Exercise Performed: [State what exercise they did]
- Movement Pattern: [Describe the movement objectively]

**Objective Rep Count:**
${exerciseContext.reps ? `- Target Reps: ${exerciseContext.reps} per set
- Actual Reps Counted: [Count every visible repetition attempt]
- Rep Assessment: [Did they get close to the target? Be generous]` : ''}
${exerciseContext.sets ? `- Target Sets: ${exerciseContext.sets}
- Sets Completed: [Count distinct groups]` : ''}
${exerciseContext.duration_seconds ? `- Target Duration: ${exerciseContext.duration_seconds} seconds
- Actual Duration: [Measure from video]` : ''}

**Form Assessment:**
- Safety: [Safe/Needs attention - focus on injury risk]
- Effort Level: [Excellent/Good/Moderate - rate their effort]
- Range of Motion: [Full/Adequate/Limited - be generous]
- Overall Technique: [Good job/Needs minor adjustments/Needs work]

**Pass/Fail Criteria:**
${exerciseContext.sets || exerciseContext.reps || exerciseContext.duration_seconds ? 
`To PASS this exercise:
${exerciseContext.reps ? `✓ Attempt at least 80% of target reps (${Math.ceil((exerciseContext.reps || 0) * 0.8)}+ reps for ${exerciseContext.reps} target)` : ''}
${exerciseContext.sets ? `✓ Complete the required sets` : ''}
${exerciseContext.duration_seconds ? `✓ Maintain exercise for reasonable duration` : ''}
✓ Demonstrate safe form (doesn't need to be perfect!)

**EVALUATION RESULT:**
${exerciseContext.reps ? `Rep Count: [Did they attempt ${Math.ceil((exerciseContext.reps || 0) * 0.8)}+ reps? Be generous!]` : ''}
Form & Safety: [Was it safe and showed good effort?]` :
'To PASS: Show good effort and safe technique'}

**Final Result: [✅ PASS or ❌ FAIL]**
[Be encouraging! Only fail for serious safety issues or completely wrong exercise. If they made a good effort and were close to targets, that's a PASS!]

**💡 Improvement Suggestions:**
[Provide 2-3 specific, actionable tips to improve form, technique, or performance]

**🎯 Next Steps:**
[Suggest what to focus on in future attempts - progression, modifications, or areas to practice]

**Encouraging Feedback:**
[Always start with something positive! Then give constructive suggestions if needed.]` :   

`Please analyze this exercise video and provide a pass/fail evaluation:

**🎯 Exercise Evaluation: [✅ PASS or ❌ FAIL]**

**Exercise Performed:**
[Identify the exercise from the video]

**Form Assessment:**
- [Evaluate technique and form quality]
- [Note any safety concerns]

**Final Result: [✅ PASS or ❌ FAIL]**
[Explain the result based on form and technique]

**💡 Improvement Suggestions:**
[Provide 2-3 specific, actionable tips for better form or technique. Focus on:
- Body positioning and alignment
- Movement speed and control
- Breathing technique
- Common mistakes to avoid
- Equipment positioning if relevant]

**🎯 Next Steps:**
[Suggest progression or focus areas for future sessions:
- If they passed: suggest ways to progress (more reps, longer duration, advanced variations)
- If they failed: suggest what to practice first before trying again
- Specific exercises or stretches that could help
- When to attempt the exercise again]

**Feedback:**
[Provide encouraging and constructive feedback]`}

IMPORTANT RULES:
- You MUST include either "✅ PASS" or "❌ FAIL" in your response
- Be specific about what they did right or wrong
- Base the pass/fail on actual performance vs requirements
- If they did the wrong exercise entirely, that's an automatic FAIL
- Focus on measurable criteria, not just encouragement
- Only pass if they truly met the exercise requirements`
      }
    ];

    console.log('Sending request to Gemini API...');

    // Generate content with retry logic
    let result;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        result = await model.generateContent(prompt);
        break; // Success, exit retry loop
      } catch (error: any) {
        if (error.status === 429 && retryCount < maxRetries) {
          // Rate limit hit, wait and retry
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
        } else {
          throw error; // Re-throw if not a rate limit or max retries reached
        }
      }
    }
    
    if (!result) {
      throw new Error('Failed to generate content after retries');
    }
    
    const response = await result.response;
    const analysis = response.text();

    if (!analysis) {
      return res.status(500).json({ error: 'No analysis generated' });
    }

    console.log('===============================');
    console.log('📊 ANALYSIS COMPLETED');
    console.log('Analysis length:', analysis.length, 'characters');
    console.log('Contains PASS:', analysis.includes('✅ PASS') || analysis.includes('✅PASS'));
    console.log('Contains FAIL:', analysis.includes('❌ FAIL') || analysis.includes('❌FAIL'));
    console.log('First 500 chars of analysis:');
    console.log(analysis.substring(0, 500));
    console.log('===============================');

    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('Error analyzing video:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (error.message.includes('quota') || error.message.includes('429')) {
        return res.status(429).json({ 
          error: 'API quota exceeded. Please wait a minute and try again, or try with a shorter video.' 
        });
      }
      if (error.message.includes('video')) {
        return res.status(400).json({ error: 'Video processing failed. Please ensure the video is a valid video file.' });
      }
    }

    return res.status(500).json({ 
      error: 'Failed to analyze video. Please try again.' 
    });
  }
}

// Increase the API route's body size limit for video uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
