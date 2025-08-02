import { NextApiRequest, NextApiResponse } from 'next';

// Note: You'll need to install the Google AI Gemini package:
// npm install @google/generative-ai

import { GoogleGenerativeAI } from '@google/generative-ai';

interface RequestBody {
  videoBase64: string;
  mimeType?: string;
  exerciseType?: string;
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

// Helper function to generate exercise-specific analysis prompts
function getExercisePrompt(exerciseType: string): string {
  const prompts = {
    // Lower Body Exercises
    squat: `Analyze this squat exercise video in detail. For each repetition:
1. Count total repetitions
2. Analyze: Knee tracking, hip hinge movement, back posture, depth, foot positioning, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    deadlift: `Analyze this deadlift exercise video in detail. For each repetition:
1. Count total repetitions  
2. Analyze: Hip hinge pattern, back posture, bar path, knee/hip extension timing, grip, setup
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    lunge: `Analyze this lunge exercise video in detail. For each repetition:
1. Count total repetitions (each leg)
2. Analyze: Step length, knee tracking, torso posture, hip flexibility, balance, depth
3. Provide timestamps for form deviations  
4. Give overall assessment and improvement recommendations`,

    bulgariansplit: `Analyze this Bulgarian split squat video. For each repetition:
1. Count total repetitions (each leg)
2. Analyze: Rear foot elevation, front leg positioning, knee tracking, torso angle, balance
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    calfraiser: `Analyze this calf raise exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Range of motion, foot positioning, balance, tempo, peak contraction
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'glute-bridge': `Analyze this glute bridge exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Hip extension range, glute activation, back position, foot placement, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'wall-sit': `Analyze this wall sit exercise video:
1. Measure hold duration
2. Analyze: Thigh-to-floor angle, back contact with wall, foot positioning, posture maintenance
3. Provide timestamps for form breakdown
4. Give overall assessment and improvement recommendations`,

    // Upper Body - Push
    pushup: `Analyze this push-up exercise video in detail. For each repetition:
1. Count total repetitions
2. Analyze: Body alignment, hand placement, depth, elbow path, core engagement, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    benchpress: `Analyze this bench press exercise video in detail. For each repetition:
1. Count total repetitions
2. Analyze: Bar path, grip width, shoulder blade retraction, arch, range of motion, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    shoulderpress: `Analyze this shoulder press exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Starting position, bar path, core stability, lockout, grip width, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    dips: `Analyze this dips exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Body angle, depth, elbow tracking, shoulder stability, leg position, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'pike-pushup': `Analyze this pike push-up exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Pike angle, hand placement, head position, range of motion, body alignment
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    // Upper Body - Pull
    pullup: `Analyze this pull-up exercise video in detail. For each repetition:
1. Count total repetitions
2. Analyze: Range of motion, grip width, body positioning, shoulder blade engagement, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    chinup: `Analyze this chin-up exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Grip position, range of motion, body stability, chin clearance, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    row: `Analyze this rowing exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Body position, pull path, shoulder blade retraction, elbow position, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'lat-pulldown': `Analyze this lat pulldown exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Grip width, pull path, body position, range of motion, shoulder engagement
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'bicep-curl': `Analyze this bicep curl exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Elbow stability, range of motion, wrist position, body stability, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    // Core & Stability
    plank: `Analyze this plank exercise video:
1. Measure hold duration
2. Analyze: Body alignment, core engagement, shoulder stability, hip position, breathing
3. Provide timestamps for form breakdown
4. Give overall assessment and improvement recommendations`,

    'side-plank': `Analyze this side plank exercise video:
1. Measure hold duration (each side)
2. Analyze: Body alignment, hip elevation, shoulder stability, core engagement
3. Provide timestamps for form breakdown
4. Give overall assessment and improvement recommendations`,

    'mountain-climber': `Analyze this mountain climber exercise video. For each repetition:
1. Count total repetitions (each leg)
2. Analyze: Plank position maintenance, knee drive, tempo, core stability
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'russian-twist': `Analyze this Russian twist exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Torso angle, rotation range, hip position, core engagement, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'dead-bug': `Analyze this dead bug exercise video. For each repetition:
1. Count total repetitions (each side)
2. Analyze: Back contact with floor, limb coordination, core stability, range of motion
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'bird-dog': `Analyze this bird dog exercise video. For each repetition:
1. Count total repetitions (each side)
2. Analyze: Spine alignment, limb extension, balance, core stability, hip stability
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    // Full Body & Cardio
    burpee: `Analyze this burpee exercise video in detail. For each repetition:
1. Count total repetitions
2. Analyze: Squat down, plank position, push-up form, jump back, jump up, flow
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'jumping-jack': `Analyze this jumping jack exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Coordination, landing mechanics, arm movement, tempo, body alignment
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'high-knees': `Analyze this high knees exercise video:
1. Count total steps/repetitions
2. Analyze: Knee height, posture, arm swing, landing, tempo, core engagement
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'jump-squat': `Analyze this jump squat exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Squat depth, jump height, landing mechanics, knee tracking, tempo
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    thruster: `Analyze this thruster exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Squat depth, front rack position, press path, hip drive, coordination
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'turkish-getup': `Analyze this Turkish get-up exercise video. For each repetition:
1. Count total repetitions (each side)
2. Analyze: Each phase transition, weight stability, movement quality, balance
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    // Olympic & Compound
    clean: `Analyze this clean exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Setup, first pull, second pull, catch position, front squat, timing
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    snatch: `Analyze this snatch exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Setup, first pull, second pull, catch position, overhead squat, timing
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'clean-and-jerk': `Analyze this clean and jerk exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Clean phase, front squat, jerk setup, jerk execution, timing, coordination
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    'overhead-squat': `Analyze this overhead squat exercise video. For each repetition:
1. Count total repetitions
2. Analyze: Overhead stability, squat depth, bar path, mobility, balance
3. Provide timestamps for form deviations
4. Give overall assessment and improvement recommendations`,

    // Flexibility & Mobility
    'yoga-pose': `Analyze this yoga pose video:
1. Identify the specific pose(s) being performed
2. Analyze: Alignment, breathing, transitions, balance, flexibility, form
3. Provide timestamps for alignment issues
4. Give overall assessment and improvement recommendations`,

    stretching: `Analyze this stretching exercise video:
1. Identify the specific stretches being performed
2. Analyze: Proper positioning, range of motion, breathing, hold duration, progression
3. Provide timestamps for form issues
4. Give overall assessment and improvement recommendations`,

    'foam-rolling': `Analyze this foam rolling video:
1. Identify body parts being targeted
2. Analyze: Positioning, pressure application, rolling speed, technique, coverage
3. Provide timestamps for technique issues
4. Give overall assessment and improvement recommendations`,

    // Custom/Other
    custom: `Analyze this exercise video with comprehensive detail:
1. First identify the exercise(s) being performed
2. Count repetitions or measure duration as appropriate
3. Provide detailed form analysis specific to the identified exercise
4. Include timestamps for any form deviations or technique issues
5. Give comprehensive assessment and specific improvement recommendations`,

    other: `Analyze this exercise video in detail:
1. First identify what exercise is being performed
2. Count repetitions or measure duration as appropriate
3. Analyze proper form and technique for this specific exercise
4. Provide timestamps for any form deviations
5. Give overall assessment and recommendations for improvement`
  };

  return prompts[exerciseType as keyof typeof prompts] || prompts.other;
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
    const { videoBase64, mimeType, exerciseType = 'squat' }: RequestBody = req.body;
    if (!videoBase64) {
      return res.status(400).json({ error: 'videoBase64 is required' });
    }

    // Detect MIME type if not provided
    const detectedMimeType = mimeType || getMimeTypeFromBase64(videoBase64);
    console.log('Detected MIME type:', detectedMimeType);

    // Convert base64 to buffer
    const videoBuffer = Buffer.from(videoBase64, 'base64');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-1.5-flash for video understanding (lighter model with higher quotas)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create the prompt with video and text parts
    const prompt = [
      {
        inlineData: {
          data: videoBase64,
          mimeType: detectedMimeType
        }
      },
      {
        text: getExercisePrompt(exerciseType) + `

Please be specific about what you observe and provide constructive feedback.`
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

    console.log('Analysis completed successfully');

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
