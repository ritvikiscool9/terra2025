// Direct test of image generation + minting
import { createThirdwebClient, getContract, sendTransaction } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { mintTo } from "thirdweb/extensions/erc721";
import { privateKeyToAccount } from "thirdweb/wallets";
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testImageGenerationAndMint() {
  console.log('🎨 Testing Gemini image generation + NFT minting...');
  
  try {
    // Step 1: Generate image with Gemini
    console.log('🔄 Step 1: Generating image with Gemini...');
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = "Create a vibrant, cartoon-style digital art illustration celebrating a fitness achievement. Show a cartoon character doing push-ups with proper form, emphasizing strong arms and core. The character should look excellent and energetic with sparkle effects. Art style: Bright, cheerful cartoon with clean lines, bold colors (blues, greens, oranges), and a modern flat design aesthetic. Include celebration elements like stars, confetti, or achievement badges. Background should be a subtle gradient. Include text 'Alex's Achievement' in a fun font.";
    
    let imageUrl = "";
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: prompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      // Look for generated image
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          
          const timestamp = Date.now();
          const filename = `nft-${timestamp}.png`;
          const publicDir = path.join(process.cwd(), 'public', 'generated-nfts');
          
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          const filepath = path.join(publicDir, filename);
          fs.writeFileSync(filepath, buffer);
          
          imageUrl = `http://localhost:3000/generated-nfts/${filename}`;
          console.log('✅ Real image generated:', imageUrl);
          break;
        }
      }
    } catch (imageError) {
      console.log('⚠️ Gemini image generation failed, using fallback:', imageError.message);
      imageUrl = "https://via.placeholder.com/512x512/4CAF50/FFFFFF?text=🏆+Push-up+Champion!";
    }

    // Step 2: Create NFT metadata
    console.log('🔄 Step 2: Creating NFT metadata...');
    const nftMetadata = {
      name: "Alex's Push-ups Achievement NFT",
      description: "Congratulations! Alex completed push-up exercises with a score of 92%. This NFT celebrates their dedication to rehabilitation and fitness.",
      image: imageUrl,
      attributes: [
        {
          trait_type: "Exercise Type",
          value: "Push-ups"
        },
        {
          trait_type: "Completion Score",
          value: "92"
        },
        {
          trait_type: "Difficulty",
          value: "Intermediate"
        },
        {
          trait_type: "Target Body Part",
          value: "Chest and Arms"
        },
        {
          trait_type: "Achievement Date",
          value: new Date().toISOString().split('T')[0]
        },
        {
          trait_type: "Rarity",
          value: "Epic"
        },
        {
          trait_type: "Generated Image",
          value: imageUrl.includes('generated-nfts') ? "Yes" : "Placeholder"
        }
      ]
    };

    console.log('📋 NFT Metadata:');
    console.log('  Name:', nftMetadata.name);
    console.log('  Image:', nftMetadata.image);
    console.log('  Attributes:', nftMetadata.attributes.length);

    // Step 3: Mint the NFT
    console.log('🔄 Step 3: Minting NFT to blockchain...');
    
    const client = createThirdwebClient({
      clientId: process.env.THIRDWEB_CLIENT_ID,
      secretKey: process.env.THIRDWEB_SECRET_KEY,
    });

    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NFT_CONTRACT_ADDRESS,
    });

    const adminAccount = privateKeyToAccount({
      client,
      privateKey: process.env.ADMIN_PRIVATE_KEY,
    });

    const transaction = mintTo({
      contract,
      to: process.env.TEST_WALLET_ADDRESS,
      nft: nftMetadata,
    });

    const receipt = await sendTransaction({
      transaction,
      account: adminAccount,
    });

    console.log('\n🎉 SUCCESS! NFT with generated image minted!');
    console.log('📦 Transaction Hash:', receipt.transactionHash);
    console.log('🔗 PolygonScan:', `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`);
    console.log('🏆 Minted to:', process.env.TEST_WALLET_ADDRESS);
    console.log('🎨 Image URL:', imageUrl);
    console.log('📄 Contract:', process.env.NFT_CONTRACT_ADDRESS);
    
    console.log('\n✅ Check your NFT in thirdweb dashboard!');
    console.log('🌐 https://thirdweb.com/dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImageGenerationAndMint();
