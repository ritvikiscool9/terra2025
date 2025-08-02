// Simple API test without image generation
import fetch from 'node-fetch';
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testBasicMint() {
  console.log('🧪 Testing basic NFT minting...');
  
  try {
    console.log('🔄 Testing connection to basic mint endpoint...');
    
    const response = await fetch('http://localhost:3000/api/nft/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: process.env.TEST_WALLET_ADDRESS,
        nftMetadata: {
          name: "Test Healthcare NFT",
          description: "Simple test NFT for healthcare app",
          image: "https://via.placeholder.com/512x512/4CAF50/FFFFFF?text=Test+NFT",
          attributes: [
            {
              trait_type: "Exercise Type",
              value: "Push-ups"
            },
            {
              trait_type: "Completion Score", 
              value: "90"
            }
          ]
        }
      }),
    });

    console.log('📡 Response status:', response.status);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Basic NFT minted!');
      console.log('📦 Transaction:', result.data?.transactionHash);
      console.log('🔗 PolygonScan:', result.data?.polygonScanUrl);
    } else {
      console.log('❌ Failed:', result);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBasicMint();
