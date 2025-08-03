// Test script for different exercise types to show mole variety
// Run with: node scripts/test-exercise-variety.js
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testExerciseVariety() {
  console.log('🎨 Testing NFT generation with different exercises...');
  
  const exercises = [
    {
      exerciseType: 'Push-ups',
      bodyPart: 'Chest and Arms',
      playerName: 'PushupChamp'
    },
    {
      exerciseType: 'Squats',
      bodyPart: 'Legs and Glutes',
      playerName: 'SquatMaster'
    },
    {
      exerciseType: 'Neck Stretches',
      bodyPart: 'Neck and Cervical',
      playerName: 'FlexibilityPro'
    },
    {
      exerciseType: 'Cardio Running',
      bodyPart: 'Cardiovascular System',
      playerName: 'RunnerExtraordinaire'
    }
  ];

  for (const exercise of exercises) {
    console.log(`\n🔄 Testing: ${exercise.exerciseType}`);
    
    const testData = {
      walletAddress: '0x009A450db4e92856a9Cb8Ef944fE070F21E06794',
      exerciseType: exercise.exerciseType,
      completionScore: 85,
      difficulty: 'Intermediate',
      bodyPart: exercise.bodyPart,
      playerName: exercise.playerName
    };
    
    try {
      const response = await fetch('http://localhost:3000/api/nft/generate-and-mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${exercise.exerciseType} NFT Success!`);
        console.log(`🎯 Exercise: ${exercise.exerciseType}`);
        console.log(`🔗 PolygonScan: ${result.data.polygonScanUrl}`);
        console.log(`🖼️ Image: ${result.data.nftMetadata.image}`);
        console.log(`📋 Name: ${result.data.nftMetadata.name}`);
      } else {
        console.log(`❌ ${exercise.exerciseType} Error:`, result);
      }
    } catch (error) {
      console.error(`❌ ${exercise.exerciseType} Request failed:`, error.message);
    }
    
    // Wait 2 seconds between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Run the test
testExerciseVariety().catch(console.error);
