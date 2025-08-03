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
    console.log('=== VIDEO ANALYSIS REQUEST ===');
    console.log('Detected MIME type:', detectedMimeType);
    console.log('Exercise context received:', JSON.stringify(exerciseContext, null, 2));
    console.log('Exercise name:', exerciseContext?.name || 'NO EXERCISE NAME PROVIDED');
    console.log('===============================');

    // Convert base64 to buffer
    const videoBuffer = Buffer.from(videoBase64, 'base64');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-1.5-flash for video understanding (lighter model with higher quotas)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create context-aware prompt
    let contextPrompt = '';
    if (exerciseContext?.name) {
      contextPrompt = `**EXERCISE CONTEXT:**
The user is performing: "${exerciseContext.name}"
${exerciseContext.description ? `Description: ${exerciseContext.description}` : ''}
${exerciseContext.instructions ? `Instructions: ${exerciseContext.instructions}` : ''}
${exerciseContext.category ? `Category: ${exerciseContext.category}` : ''}
${exerciseContext.difficulty_level ? `Difficulty Level: ${exerciseContext.difficulty_level}` : ''}
${exerciseContext.sets ? `Target Sets: ${exerciseContext.sets}` : ''}
${exerciseContext.reps ? `Target Reps: ${exerciseContext.reps}` : ''}
${exerciseContext.duration_seconds ? `Target Duration: ${exerciseContext.duration_seconds} seconds` : ''}

Please analyze the video specifically for this exercise. Pay attention to form, technique, and adherence to the prescribed parameters.

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
        text: `${contextPrompt}As a supportive physical therapy assistant, analyze this exercise video and provide encouraging, constructive feedback. Focus on being helpful and motivational while giving practical advice.

${exerciseContext?.name ? `The patient was supposed to perform: "${exerciseContext.name}"

IMPORTANT: First, carefully observe what exercise the person is actually performing in the video. If they are doing a DIFFERENT exercise than expected, address this immediately in your response.

Please provide feedback in this format:

**🎯 Exercise Analysis:**
[First identify what exercise they actually performed. If it matches the expected exercise, congratulate them. If it's different, gently point this out]

**What I observed:**
- [Acknowledge their effort and what they did in the video]
- [If they did the wrong exercise, explain what they did vs what was expected]

**Form feedback:**
- [If correct exercise: provide form feedback]
- [If wrong exercise: suggest how to do the correct exercise]

**Next steps:**
- [Practical guidance for improvement]
- [Encouragement to try the correct exercise if needed]

**Keep it up!**
[End with motivation]` : 

`Please analyze this exercise video and provide supportive feedback:

**🎯 Exercise Analysis:**
[Identify what exercise they performed]

**What I observed:**
- [Acknowledge their effort and technique]

**Form feedback:**
- [Provide constructive feedback about their technique]

**Suggestions for improvement:**
- [2-3 specific, actionable tips]

**You're doing great!**
[End with encouragement]`}

Remember: 
- Be encouraging and supportive, not clinical
- Focus on form and technique, not scoring or rating
- Give practical tips they can actually use
- Acknowledge their effort and progress
- Keep feedback positive and motivational
- Avoid overwhelming them with too many corrections at once
- If they did the wrong exercise, gently redirect them to the correct one`
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
