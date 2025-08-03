import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import * as fs from "fs";
import * as path from "path";

// Create admin Supabase client directly (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ImageGenerationRequest {
  exerciseType: string;
  completionScore: number;
  difficulty: string;
  bodyPart: string;
  playerName?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      exerciseType, 
      completionScore, 
      difficulty, 
      bodyPart,
      playerName = "Champion"
    }: ImageGenerationRequest = req.body;

    console.log('🎨 Starting NFT image generation...');
    console.log('📋 Request details:', { exerciseType, completionScore, difficulty, bodyPart, playerName });

    // Validate required fields
    if (!exerciseType || completionScore === undefined || !difficulty || !bodyPart) {
      return res.status(400).json({ 
        error: 'Missing required fields: exerciseType, completionScore, difficulty, bodyPart' 
      });
    }

    // Step 1: Generate image prompt based on exercise
    const imagePrompt = generateMoleImagePrompt(exerciseType, completionScore, difficulty, bodyPart, playerName);
    console.log('💡 Generated image prompt:', imagePrompt);

    // Step 2: Generate image with Gemini
    console.log('🎨 Generating mole-themed image with Gemini AI...');
    const imageUrl = await generateImageWithGemini(imagePrompt);
    console.log('✅ Image generated successfully:', imageUrl);

    // Step 3: Create NFT metadata
    const nftMetadata = {
      name: `${playerName}'s Underground ${exerciseType} Achievement`,
      description: `🏆 Congratulations! ${playerName} has earned this exclusive Mole Fitness NFT by completing ${exerciseType} exercises with an impressive score of ${completionScore}%. Our adorable mole mascot celebrates this dedication to rehabilitation and fitness from the underground gym! This NFT represents perseverance, dedication, and the underground spirit of never giving up on your health journey.`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Exercise Type",
          value: exerciseType
        },
        {
          trait_type: "Completion Score",
          value: completionScore.toString()
        },
        {
          trait_type: "Difficulty",
          value: difficulty
        },
        {
          trait_type: "Target Body Part",
          value: bodyPart
        },
        {
          trait_type: "Achievement Date",
          value: new Date().toISOString().split('T')[0]
        },
        {
          trait_type: "Rarity",
          value: getRarity(completionScore)
        },
        {
          trait_type: "Theme",
          value: "Underground Mole Fitness"
        },
        {
          trait_type: "Character",
          value: "Motivational Mole Coach"
        }
      ]
    };

    console.log('🎉 NFT metadata generated successfully!');

    return res.status(200).json({
      success: true,
      message: 'NFT image and metadata generated successfully!',
      data: {
        imageUrl,
        nftMetadata,
        imagePrompt
      }
    });

  } catch (error) {
    console.error('❌ Error in generate-image:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to generate NFT image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function generateMoleImagePrompt(exerciseType: string, score: number, difficulty: string, bodyPart: string, playerName: string): string {
  const scoreLevel = score >= 90 ? "perfect" : score >= 80 ? "excellent" : score >= 70 ? "good" : "decent";
  
  const basePrompt = `Create a vibrant, motivational cartoon illustration featuring an adorable anthropomorphic mole character as a fitness coach or athlete. The mole should have cute features like small glasses, a friendly smile, and be wearing modern workout attire. `;
  
  const exerciseSpecific = getMoleExerciseSpecificPrompt(exerciseType, bodyPart);
  
  const achievementLevel = `The mole character should look ${scoreLevel === "perfect" ? "triumphant and glowing with golden effects and a trophy or medal" : 
    scoreLevel === "excellent" ? "proud and energetic with sparkle effects and a thumbs up gesture" : 
    scoreLevel === "good" ? "happy and confident with an encouraging expression" : "determined and motivated with a never-give-up attitude"}. `;
  
  const styleGuide = `Art style: Bright, cheerful cartoon with clean lines, bold colors (earth tones like browns and greens mixed with vibrant blues and oranges), and a modern flat design aesthetic perfect for an NFT. `;
  
  const moleTheme = `The mole should have distinctive features: brown fur, pink nose, small dark eyes, tiny paws that can hold exercise equipment, and an underground/earth theme in the background. `;
  
  const celebrationElements = `Include celebration elements like stars, confetti, achievement badges, or small underground tunnel entrances. `;
  
  const background = `Background should feature an underground gym or fitness cave with earthy tones, or an outdoor scene with hills and burrows, creating a mole-friendly environment. `;
  
  const textElement = `Include a small text element that says "${playerName}'s Mole Achievement" in a fun, underground-themed font. `;
  
  return basePrompt + exerciseSpecific + achievementLevel + styleGuide + moleTheme + celebrationElements + background + textElement;
}

function getMoleExerciseSpecificPrompt(exerciseType: string, bodyPart: string): string {
  const exercise = exerciseType.toLowerCase();
  
  if (exercise.includes('push') || exercise.includes('press')) {
    return `Show the mole character doing push-ups with tiny paws pushing against the ground, emphasizing strong arms and determination. The mole might be wearing a small sweatband and look focused. `;
  } else if (exercise.includes('squat')) {
    return `Show the mole character in a squat position with strong little legs and good posture, perhaps next to some underground workout equipment or mole-sized weights. `;
  } else if (exercise.includes('plank')) {
    return `Show the mole character holding a plank position with focus on core strength, maybe balancing on a small underground platform or wooden board. `;
  } else if (exercise.includes('stretch') || exercise.includes('flexibility')) {
    return `Show the mole character in a graceful stretching pose with flowing movements, perhaps stretching near some underground plants or in a peaceful burrow setting. `;
  } else if (exercise.includes('cardio') || exercise.includes('run')) {
    return `Show the mole character in motion with energy lines, running through underground tunnels or on a small treadmill designed for moles. `;
  } else {
    return `Show the mole character performing ${exerciseType} exercises with focus on the ${bodyPart} area, in a cozy underground gym setting with mole-sized equipment. `;
  }
}

function getRarity(score: number): string {
  if (score >= 95) return "Legendary";
  if (score >= 90) return "Epic";
  if (score >= 80) return "Rare";
  if (score >= 70) return "Uncommon";
  return "Common";
}

async function generateImageWithGemini(prompt: string): Promise<string> {
  try {
    console.log('🎨 Generating REAL mole-themed image with Gemini AI...');
    
    // Use Gemini's native image generation capability
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Enhanced prompt for better NFT images
    const imagePrompt = `Create a vibrant, high-quality digital NFT artwork: ${prompt}. 
    Make it visually striking with bright colors, sharp details, and a professional finish suitable for an NFT collection. 
    Style: Modern digital art, clean composition, motivational and celebratory theme with mole characters.`;
    
    console.log('🔄 Sending image generation request to Gemini...');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: imagePrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Look for generated image in the response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          
          // Save the image to public directory
          const timestamp = Date.now();
          const filename = `mole-nft-${timestamp}.png`;
          const publicDir = path.join(process.cwd(), 'public', 'generated-nfts');
          
          // Ensure directory exists
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          const filepath = path.join(publicDir, filename);
          fs.writeFileSync(filepath, buffer);
          
          const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/generated-nfts/${filename}`;
          
          console.log('✅ REAL Gemini mole image generated and saved!');
          console.log('📁 Saved to:', filepath);
          console.log('🔗 URL:', imageUrl);
          
          return imageUrl;
        }
      }
    }
    
    // If no image was generated, throw an error to trigger fallback
    throw new Error('No image data received from Gemini');
    
  } catch (error) {
    console.error('❌ Gemini image generation failed:', error);
    console.log('🔄 Falling back to mole-themed placeholder images...');
    
    // Fallback to mole-themed images
    const exerciseType = prompt.toLowerCase();
    let imageUrl: string;
    
    if (exerciseType.includes('push')) {
      imageUrl = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=512&h=512&fit=crop&crop=center";
    } else if (exerciseType.includes('squat')) {
      imageUrl = "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=512&h=512&fit=crop&crop=center";
    } else if (exerciseType.includes('plank')) {
      imageUrl = "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=512&h=512&fit=crop&crop=center";
    } else if (exerciseType.includes('cardio') || exerciseType.includes('run')) {
      imageUrl = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=512&h=512&fit=crop&crop=center";
    } else {
      // Default mole fitness achievement image
      imageUrl = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=512&h=512&fit=crop&crop=center";
    }
    
    console.log('📸 Using fallback image:', imageUrl);
    return imageUrl;
  }
}
