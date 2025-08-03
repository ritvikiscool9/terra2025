// Test script for the generate-and-mint API
// Run with: node scripts/test-generate-mint.js
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGenerateAndMint() {
  console.log('🎨 Testing Generate and Mint API...');
  
  const testData = {
    walletAddress: '0x009A450db4e92856a9Cb8Ef944fE070F21E06794',
    exerciseType: 'Wrist Rotations',
    difficulty: 'Easy',
    bodyPart: 'Wrist and Forearm'
  };
  
  console.log('📋 Test data:', testData);
  console.log('🔄 Sending request to API...');
  
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
      console.log('✅ API Success!');
      console.log('🎉 NFT Generated and Minted!');
      console.log('📄 Transaction Hash:', result.data.transactionHash);
      console.log('🔗 PolygonScan:', result.data.polygonScanUrl);
      console.log('📋 NFT Metadata:', JSON.stringify(result.data.nftMetadata, null, 2));
    } else {
      console.log('❌ API Error:', result);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('💡 Make sure your Next.js server is running with: npm run dev');
  }
}

// Run the test
testGenerateAndMint().catch(console.error);