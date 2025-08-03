import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from "@google/genai";
import { createThirdwebClient, getContract, sendTransaction } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { mintTo } from "thirdweb/extensions/erc721";
import { privateKeyToAccount } from "thirdweb/wallets";
import { createClient } from '@supabase/supabase-js';
import * as fs from "fs";
import * as path from "path";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Create admin Supabase client directly (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MintRequest {
  walletAddress: string;
  exerciseType: string;
  difficulty: string;
  bodyPart: string;
  playerName?: string;
  patientId?: string;
  exerciseCompletionId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      walletAddress, 
      exerciseType, 
      difficulty, 
      bodyPart,
      playerName = "Champion",
      patientId,
      exerciseCompletionId
    }: MintRequest = req.body;

    console.log('🎨 Starting NFT generation and minting process...');
    console.log('📋 Request details:', { exerciseType, difficulty, bodyPart, walletAddress, patientId, exerciseCompletionId });

    // Validate required fields
    if (!walletAddress || !exerciseType || !difficulty || !bodyPart) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, exerciseType, difficulty, bodyPart' 
      });
    }

    // For database saving, we need patientId and exerciseCompletionId
    // If not provided, we'll create a mock entry or use default values
    let finalPatientId: string;
    let finalExerciseCompletionId: string;

    // If no patientId provided, try to get the first patient for demo purposes
    if (!patientId) {
      console.log('🔍 No patientId provided, looking up demo patient...');
      const { data: patients, error: patientError } = await supabaseAdmin
        .from('patients')
        .select('id')
        .limit(1);
      
      if (patientError || !patients || patients.length === 0) {
        return res.status(400).json({ 
          error: 'Patient ID required for NFT creation. Please provide patientId or ensure patients exist in database.' 
        });
      }
      
      finalPatientId = patients[0].id;
      console.log('✅ Using demo patient ID:', finalPatientId);
    } else {
      finalPatientId = patientId;
    }

    // If no exerciseCompletionId provided, create a placeholder or use existing one
    if (!exerciseCompletionId) {
      console.log('🔍 No exerciseCompletionId provided, looking up recent completion...');
      const { data: completions, error: completionError } = await supabaseAdmin
        .from('exercise_completions')
        .select('id')
        .eq('patient_id', finalPatientId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (completionError || !completions || completions.length === 0) {
        // Create a complete chain: exercise → routine → routine_exercise → exercise_completion
        console.log('📝 Creating placeholder exercise completion chain...');
        
        try {
          // 1. Get or create an exercise
          let { data: exercises, error: exerciseError } = await supabaseAdmin
            .from('exercises')
            .select('id')
            .eq('name', exerciseType)
            .limit(1);
          
          let exerciseId: string;
          if (exerciseError || !exercises || exercises.length === 0) {
            // Create a new exercise
            const { data: newExercise, error: createExerciseError } = await supabaseAdmin
              .from('exercises')
              .insert({
                name: exerciseType,
                description: `${exerciseType} exercise for ${bodyPart}`,
                category: bodyPart.toLowerCase().replace(' ', '_'),
                difficulty_level: difficulty === 'Easy' ? 1 : difficulty === 'Intermediate' ? 2 : 3,
                default_sets: 3,
                default_reps: 10,
                instructions: `Perform ${exerciseType} targeting ${bodyPart}`
              })
              .select('id')
              .single();
            
            if (createExerciseError || !newExercise) {
              throw new Error(`Failed to create exercise: ${createExerciseError?.message}`);
            }
            exerciseId = newExercise.id;
            console.log('✅ Created exercise:', exerciseId);
          } else {
            exerciseId = exercises[0].id;
            console.log('✅ Using existing exercise:', exerciseId);
          }

          // 2. Get or create a routine
          let { data: routines, error: routineError } = await supabaseAdmin
            .from('routines')
            .select('id')
            .eq('patient_id', finalPatientId)
            .eq('is_active', true)
            .limit(1);
          
          let routineId: string;
          if (routineError || !routines || routines.length === 0) {
            // Get a doctor to assign the routine to
            const { data: doctors, error: doctorError } = await supabaseAdmin
              .from('doctors')
              .select('id')
              .limit(1);
            
            if (doctorError || !doctors || doctors.length === 0) {
              throw new Error('No doctors found to assign routine');
            }

            // Create a new routine
            const { data: newRoutine, error: createRoutineError } = await supabaseAdmin
              .from('routines')
              .insert({
                patient_id: finalPatientId,
                prescribed_by_doctor_id: doctors[0].id,
                title: 'NFT Reward Routine',
                description: 'Routine for NFT achievement rewards',
                start_date: new Date().toISOString().split('T')[0],
                frequency_per_week: 3,
                is_active: true
              })
              .select('id')
              .single();
            
            if (createRoutineError || !newRoutine) {
              throw new Error(`Failed to create routine: ${createRoutineError?.message}`);
            }
            routineId = newRoutine.id;
            console.log('✅ Created routine:', routineId);
          } else {
            routineId = routines[0].id;
            console.log('✅ Using existing routine:', routineId);
          }

          // 3. Get or create routine_exercise
          let { data: routineExercises, error: routineExerciseError } = await supabaseAdmin
            .from('routine_exercises')
            .select('id')
            .eq('routine_id', routineId)
            .eq('exercise_id', exerciseId)
            .limit(1);
          
          let routineExerciseId: string;
          if (routineExerciseError || !routineExercises || routineExercises.length === 0) {
            // Create a new routine_exercise
            const { data: newRoutineExercise, error: createRoutineExerciseError } = await supabaseAdmin
              .from('routine_exercises')
              .insert({
                routine_id: routineId,
                exercise_id: exerciseId,
                sets: 3,
                reps: 10,
                order_in_routine: 1
              })
              .select('id')
              .single();
            
            if (createRoutineExerciseError || !newRoutineExercise) {
              throw new Error(`Failed to create routine_exercise: ${createRoutineExerciseError?.message}`);
            }
            routineExerciseId = newRoutineExercise.id;
            console.log('✅ Created routine_exercise:', routineExerciseId);
          } else {
            routineExerciseId = routineExercises[0].id;
            console.log('✅ Using existing routine_exercise:', routineExerciseId);
          }

          // 4. Create exercise_completion
          const { data: newCompletion, error: createCompletionError } = await supabaseAdmin
            .from('exercise_completions')
            .insert({
              routine_exercise_id: routineExerciseId,
              patient_id: finalPatientId,
              completion_status: 'completed',
              form_score: 85, // Default score for NFT completion
              nft_minted: false,
              actual_sets: 3,
              actual_reps: 10
            })
            .select('id')
            .single();
          
          if (createCompletionError || !newCompletion) {
            throw new Error(`Failed to create exercise completion: ${createCompletionError?.message}`);
          }
          
          finalExerciseCompletionId = newCompletion.id;
          console.log('✅ Created exercise completion:', finalExerciseCompletionId);
          
        } catch (error) {
          console.error('❌ Error creating exercise completion chain:', error);
          throw new Error(`Failed to create exercise completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        finalExerciseCompletionId = completions[0].id;
        console.log('✅ Using existing completion ID:', finalExerciseCompletionId);
      }
    } else {
      finalExerciseCompletionId = exerciseCompletionId;
    }

    // Step 1: Generate image prompt based on exercise
    const imagePrompt = generateImagePrompt(exerciseType, difficulty, bodyPart, playerName);
    console.log('💡 Generated image prompt:', imagePrompt);

    // Step 2: Generate image with Gemini
    console.log('🎨 Generating image with Gemini AI...');
    const imageUrl = await generateImageWithGemini(imagePrompt);
    console.log('✅ Image generated successfully:', imageUrl);

    // Step 3: Create NFT metadata
    const nftMetadata = {
      name: `Underground ${exerciseType} Achievement`,
      description: `🏆 This exclusive Mole Fitness NFT celebrates completing ${exerciseType} exercises with dedication to rehabilitation and fitness from the underground gym! This NFT represents perseverance, dedication, and the underground spirit of never giving up on your health journey.`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Exercise Type",
          value: exerciseType
        },
        {
          trait_type: "Target Body Part",
          value: bodyPart
        },
        {
          trait_type: "Difficulty Level",
          value: difficulty
        },
        {
          trait_type: "Achievement Date",
          value: new Date().toISOString().split('T')[0]
        },
        {
          trait_type: "Underground Theme",
          value: "Mole Fitness Coach"
        },
        {
          trait_type: "Workout Category",
          value: bodyPart.toLowerCase().replace(' ', '_')
        },
        {
          trait_type: "Completion Status",
          value: "Completed Successfully"
        },
        {
          trait_type: "NFT Series",
          value: "Underground Fitness Collection"
        }
      ]
    };

    // Step 4: Mint the NFT
    console.log('⚡ Minting NFT to blockchain...');
    const mintResult = await mintNFT(walletAddress, nftMetadata);

    // Step 5: Save NFT data to database
    console.log('💾 Saving NFT data to database...');
    const nftDbResult = await saveNFTToDatabase({
      patientId: finalPatientId,
      exerciseCompletionId: finalExerciseCompletionId,
      nftMetadata,
      imageUrl,
      imagePrompt,
      walletAddress,
      transactionHash: mintResult.transactionHash,
      exerciseType,
      difficulty,
      bodyPart
    });

    // Step 6: Update exercise completion record to mark NFT as minted
    if (finalExerciseCompletionId !== '00000000-0000-0000-0000-000000000000') {
      await supabaseAdmin
        .from('exercise_completions')
        .update({ 
          nft_minted: true,
          nft_token_id: nftDbResult.id // Use our database ID as reference
        })
        .eq('id', finalExerciseCompletionId);
    }

    console.log('🎉 NFT successfully generated and minted!');

    return res.status(200).json({
      success: true,
      message: 'NFT generated and minted successfully!',
      data: {
        nftMetadata,
        transactionHash: mintResult.transactionHash,
        tokenId: mintResult.tokenId,
        polygonScanUrl: `https://amoy.polygonscan.com/tx/${mintResult.transactionHash}`,
        contractAddress: process.env.NFT_CONTRACT_ADDRESS,
        mintedTo: walletAddress
      }
    });

  } catch (error) {
    console.error('❌ Error in generate-and-mint:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to generate and mint NFT',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function generateImagePrompt(exerciseType: string, difficulty: string, bodyPart: string, playerName: string): string {
  // Random cool environments for the mole
  const environments = [
    "an underground futuristic gym with neon lighting and high-tech equipment",
    "a cozy underground cave gym with wooden equipment and warm lighting", 
    "an outdoor mountain burrow with natural rock formations and sunrise",
    "an underground laboratory fitness center with scientific equipment",
    "a magical underground garden gym with glowing plants and crystals",
    "an underground steampunk workshop with brass equipment and gears",
    "a modern underground fitness studio with mirrors and sleek design",
    "an underground beach cave with sandy floors and ocean views"
  ];
  
  // Random cool outfits for the mole
  const outfits = [
    "wearing trendy athletic wear with a backwards cap and wristbands",
    "sporting a vintage tracksuit with retro sneakers",
    "dressed in futuristic workout gear with LED accents",
    "wearing a cute yoga outfit with a headband",
    "sporting professional athletic gear like a coach",
    "dressed in colorful workout clothes with fun patterns",
    "wearing a superhero-inspired fitness costume",
    "sporting outdoor adventure gear with a utility belt"
  ];
  
  const randomEnvironment = environments[Math.floor(Math.random() * environments.length)];
  const randomOutfit = outfits[Math.floor(Math.random() * outfits.length)];
  
  const basePrompt = `Create a vibrant, high-quality NFT artwork featuring an adorable anthropomorphic mole character ${randomOutfit}. The scene is set in ${randomEnvironment}. `;
  
  const exerciseSpecific = getExerciseSpecificPrompt(exerciseType, bodyPart);
  
  const achievementLevel = `The mole character should look proud and energetic with rainbow sparkle effects and a big smile, celebrating the completion of ${exerciseType}. `;
  
  const styleGuide = `Art style: Professional NFT quality, bright and vibrant cartoon with clean lines, bold colors (earth tones like browns and greens mixed with vibrant blues, oranges, and purples), modern digital art aesthetic with excellent lighting and shadows. `;
  
  const moleFeatures = `The mole should have distinctive cute features: fluffy brown fur, bright pink nose, sparkling dark eyes, tiny expressive paws, and a friendly personality that shines through. `;
  
  const celebrationElements = `Include celebration elements like floating stars, confetti particles, achievement badges, or magical sparkles around the mole. `;
  
  return basePrompt + exerciseSpecific + achievementLevel + styleGuide + moleFeatures + celebrationElements;
}

function getExerciseSpecificPrompt(exerciseType: string, bodyPart: string): string {
  const exercise = exerciseType.toLowerCase();
  
  // Wrist and hand exercises
  if (exercise.includes('wrist') || exercise.includes('hand') || exercise.includes('finger')) {
    return `The mole is actively performing wrist exercises - rotating tiny dumbbells with its paws, doing wrist flexions and extensions, or squeezing a small exercise ball. Focus on the mole's paws and wrist movements with clear detail showing the specific wrist exercise motion. `;
  }
  // Push-ups and pressing movements
  else if (exercise.includes('push') || exercise.includes('press')) {
    return `The mole is in the middle of doing push-ups with perfect form - tiny paws planted firmly on the ground, body in a straight plank position, showing the exact moment of pushing up or holding the position. The mole's arms and chest muscles should be clearly engaged. `;
  }
  // Squats and leg exercises
  else if (exercise.includes('squat') || exercise.includes('leg') || exercise.includes('thigh')) {
    return `The mole is performing a deep squat with excellent form - knees bent, bottom low, tiny paws together in front for balance. The mole's leg muscles should be clearly defined and engaged, showing strength and proper squat technique. `;
  }
  // Plank and core exercises
  else if (exercise.includes('plank') || exercise.includes('core') || exercise.includes('ab')) {
    return `The mole is holding a perfect plank position - body straight as a board, tiny paws supporting its weight, core engaged and strong. Show the mole's determination and core strength with visible muscle definition and steady positioning. `;
  }
  // Stretching and flexibility
  else if (exercise.includes('stretch') || exercise.includes('flexibility') || exercise.includes('yoga')) {
    return `The mole is gracefully performing a stretching pose - perhaps touching its toes, doing a side stretch, or in a yoga-inspired position. The mole should look serene and flexible, with flowing movements and excellent form. `;
  }
  // Cardio and running
  else if (exercise.includes('cardio') || exercise.includes('run') || exercise.includes('jog')) {
    return `The mole is in dynamic motion - running or jogging with energy lines showing movement, paws moving in rhythm, maybe on a treadmill or running through tunnels. Show the mole's cardiovascular effort with motion blur and dynamic energy. `;
  }
  // Shoulder exercises
  else if (exercise.includes('shoulder') || exercise.includes('arm raise')) {
    return `The mole is performing shoulder exercises - raising tiny weights overhead, doing lateral arm raises, or shoulder rotations. Focus on the mole's shoulder and arm movements with clear demonstration of the specific shoulder exercise. `;
  }
  // Back exercises
  else if (exercise.includes('back') || exercise.includes('row') || exercise.includes('pull')) {
    return `The mole is doing back exercises - performing rowing motions, pull-ups on a tiny bar, or back extensions. Show the mole's back muscles engaged and the specific pulling or rowing movement being performed. `;
  }
  // Neck exercises
  else if (exercise.includes('neck') || exercise.includes('cervical')) {
    return `The mole is carefully performing neck exercises - gentle neck rotations, side-to-side movements, or neck stretches. The mole should look focused and gentle with the neck movements, showing proper form and care. `;
  }
  // Balance exercises
  else if (exercise.includes('balance') || exercise.includes('stability')) {
    return `The mole is demonstrating excellent balance - standing on one paw, using a balance board, or performing a stability exercise. Show the mole's concentration and steady positioning with arms out for balance. `;
  }
  // Generic exercise fallback
  else {
    return `The mole is actively performing ${exerciseType} exercises with focus on the ${bodyPart} area. The mole should be clearly demonstrating the specific exercise movement with proper form, showing engagement of the target muscle group and athletic ability. `;
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
    console.log('🎨 Generating REAL image with Gemini AI...');
    
    // Use Gemini's native image generation capability
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Enhanced prompt for better NFT images
    const imagePrompt = `Create a vibrant, high-quality digital NFT artwork: ${prompt}. 
    Make it visually striking with bright colors, sharp details, and a professional finish suitable for an NFT collection. 
    Style: Modern digital art, clean composition, motivational and celebratory theme.`;
    
    console.log('🔄 Sending image generation request to Gemini...');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: imagePrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Look for generated image in the response
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
        
        // Save the image to public directory
        const timestamp = Date.now();
        const filename = `nft-${timestamp}.png`;
        const publicDir = path.join(process.cwd(), 'public', 'generated-nfts');
        
        // Ensure directory exists
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        const filepath = path.join(publicDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/generated-nfts/${filename}`;
        
        console.log('✅ REAL Gemini image generated and saved!');
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
    console.log('🔄 Falling back to themed placeholder images...');
    
    // Fallback to themed images if Gemini fails
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
      // Default fitness achievement image
      imageUrl = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=512&h=512&fit=crop&crop=center";
    }
    
    console.log('📸 Using fallback image:', imageUrl);
    return imageUrl;
  }
}

async function mintNFT(walletAddress: string, nftMetadata: any) {
  try {
    // Initialize thirdweb client
    const client = createThirdwebClient({
      clientId: process.env.THIRDWEB_CLIENT_ID!,
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Get contract
    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NFT_CONTRACT_ADDRESS!,
    });

    // Create admin account
    const adminAccount = privateKeyToAccount({
      client,
      privateKey: process.env.ADMIN_PRIVATE_KEY!,
    });

    // Create mint transaction
    const transaction = mintTo({
      contract,
      to: walletAddress,
      nft: nftMetadata,
    });

    // Send transaction
    const receipt = await sendTransaction({
      transaction,
      account: adminAccount,
    });

    console.log('🔍 Full receipt:', JSON.stringify(receipt, null, 2));

    // For now, we'll generate a placeholder token ID and improve this later
    // In a real implementation, you'd parse the transaction receipt logs
    const tokenId = Date.now().toString(); // Temporary placeholder

    return {
      ...receipt,
      tokenId
    };

  } catch (error) {
    console.error('Error minting NFT:', error);
    throw error;
  }
}

interface SaveNFTParams {
  patientId: string;
  exerciseCompletionId: string;
  nftMetadata: any;
  imageUrl: string;
  imagePrompt: string;
  walletAddress: string;
  transactionHash: string;
  exerciseType: string;
  difficulty: string;
  bodyPart: string;
}

async function saveNFTToDatabase(params: SaveNFTParams) {
  try {
    const {
      patientId,
      exerciseCompletionId,
      nftMetadata,
      imageUrl,
      imagePrompt,
      walletAddress,
      transactionHash,
      exerciseType,
      difficulty,
      bodyPart
    } = params;

    console.log('💾 Inserting NFT record into database...');
    
    const nftRecord = {
      patient_id: patientId,
      exercise_completion_id: exerciseCompletionId,
      name: nftMetadata.name,
      description: nftMetadata.description,
      image_url: imageUrl,
      token_id: null, // Thirdweb v5 doesn't return token_id in the receipt
      contract_address: process.env.NFT_CONTRACT_ADDRESS!,
      wallet_address: walletAddress,
      transaction_hash: transactionHash,
      block_number: null, // Not available in current receipt
      exercise_type: exerciseType,
      completion_score: 85, // Default completion score
      difficulty_level: difficulty,
      body_part: bodyPart,
      rarity: "Epic", // Default rarity since no score
      minted: true,
      minted_at: new Date().toISOString(),
      ai_generated: true,
      image_prompt: imagePrompt,
      generation_model: 'gemini-pro',
      attributes: nftMetadata.attributes,
      metadata_uri: null, // Could be added if metadata is stored on IPFS
      viewed_by_patient: false,
      viewed_by_doctor: false
    };

    const { data: savedNFT, error: nftError } = await supabaseAdmin
      .from('nfts')
      .insert(nftRecord)
      .select()
      .single();

    if (nftError) {
      console.error('❌ Failed to save NFT to database:', nftError);
      throw new Error(`Database save failed: ${nftError.message}`);
    }

    console.log('✅ NFT record saved to database with ID:', savedNFT.id);
    return savedNFT;

  } catch (error) {
    console.error('❌ Error saving NFT to database:', error);
    throw error;
  }
}
