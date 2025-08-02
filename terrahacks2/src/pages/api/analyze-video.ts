import { NextApiRequest, NextApiResponse } from 'next';

// Note: You'll need to install the Google AI Gemini package:
// npm install @google/generative-ai

import { GoogleGenerativeAI } from '@google/generative-ai';

interface RequestBody {
  videoBase64: string;
  mimeType?: string;
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
    const { videoBase64, mimeType }: RequestBody = req.body;
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
        text: `Analyze this squat exercise video in detail. For each repetition you can identify:

1. Count the total number of squat repetitions
2. For each rep, analyze:
   - Knee tracking (do knees cave inward or track over toes properly?)
   - Hip hinge movement (proper hip-back movement vs knee-dominant squat)
   - Back posture (neutral spine vs excessive forward lean or arch)
   - Depth (reaching proper depth with hip crease below knee level)
   - Foot positioning and weight distribution
   - Overall tempo and control

3. Provide timestamps when possible for each rep and any form deviations
4. Give an overall assessment and recommendations for improvement

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
