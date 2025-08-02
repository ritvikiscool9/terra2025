import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGeminiImageGeneration() {
  console.log('🎨 Testing Gemini Image Generation...');

  try {
    // Initialize Gemini AI
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY 
    });

    console.log('✅ Gemini AI initialized');

    // Create a healthcare/fitness themed prompt
    const contents = 
      "Create a vibrant, cartoon-style digital art illustration celebrating a fitness achievement. " +
      "Show a cartoon character doing push-ups with proper form, emphasizing strong arms and core. " +
      "The character should look excellent and energetic with sparkle effects. " +
      "Art style: Bright, cheerful cartoon with clean lines, bold colors (blues, greens, oranges), " +
      "and a modern flat design aesthetic. Include celebration elements like stars, confetti, " +
      "or achievement badges. Background should be a subtle gradient. " +
      "Include a small text element that says 'Achievement Unlocked!' in a fun, readable font.";

    console.log('🔄 Generating image with prompt:');
    console.log('   ', contents.substring(0, 100) + '...');

    // Generate content with both text and image
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    console.log('📡 Response received from Gemini');
    console.log('📊 Number of candidates:', response.candidates?.length || 0);

    if (response.candidates && response.candidates.length > 0) {
      console.log('📦 Number of parts:', response.candidates[0].content.parts.length);

      // Process each part of the response
      for (const part of response.candidates[0].content.parts) {
        // Check for text response
        if (part.text) {
          console.log('📝 Text response:', part.text);
        } 
        // Check for image response
        else if (part.inlineData) {
          console.log('🎨 Image data found! Processing...');
          
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          
          // Save to public/generated-nfts directory
          const timestamp = Date.now();
          const filename = `fitness-achievement-${timestamp}.png`;
          const publicDir = './public/generated-nfts';
          
          // Ensure directory exists
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          const filepath = `${publicDir}/${filename}`;
          fs.writeFileSync(filepath, buffer);
          
          console.log('✅ Image saved successfully!');
          console.log('📁 File path:', filepath);
          console.log('🔗 URL:', `http://localhost:3000/generated-nfts/${filename}`);
          console.log('📏 Image size:', buffer.length, 'bytes');
          
          // Return the URL for potential NFT use
          return `http://localhost:3000/generated-nfts/${filename}`;
        }
      }
    } else {
      console.log('❌ No candidates in response');
    }

  } catch (error) {
    console.error('❌ Error generating image:', error);
    
    if (error.message.includes('API key')) {
      console.log('💡 Check your GEMINI_API_KEY in .env.local');
    } else if (error.message.includes('quota')) {
      console.log('💡 You might have hit API quota limits');
    } else if (error.message.includes('model')) {
      console.log('💡 The model might not be available or have different name');
    }
  }
}

// Run the test
testGeminiImageGeneration()
  .then(imageUrl => {
    if (imageUrl) {
      console.log('\n🎉 SUCCESS! Image generated and ready for NFT minting!');
      console.log('🔗 Image URL:', imageUrl);
      console.log('\n📝 Next steps:');
      console.log('   1. View the image at:', imageUrl);
      console.log('   2. Use this URL in NFT metadata');
      console.log('   3. Mint NFT with the generated image');
    } else {
      console.log('\n⚠️ No image was generated, but no errors occurred');
    }
  })
  .catch(console.error);
