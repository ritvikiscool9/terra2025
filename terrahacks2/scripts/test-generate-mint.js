// Test script for the generate-and-mint API
// Run with: npm run test:generate-mint
import dotenv from "dotenv";
import fetch from "node-fetch";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGenerateAndMint() {
  console.log('🚀 Testing NFT Generate and Mint API...\n');
  console.log('═══════════════════════════════════════');
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
  
  const testData = {
    walletAddress: '0x009A450db4e92856a9Cb8Ef944fE070F21E06794',
    exerciseType: 'Push-ups',
    difficulty: 'Intermediate',
    bodyPart: 'Chest and Arms',
    playerName: 'Test Champion'
    // Note: patientId and exerciseCompletionId will be auto-created by the API
  };
  
  console.log('📋 Test data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n🔄 Sending API request...\n');
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft/generate-and-mint`
      : 'http://localhost:3000/api/nft/generate-and-mint';

    console.log(`📡 Making request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    // Try to parse JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON');
      console.log('📄 Raw response:', responseText);
      return;
    }
    
    if (response.ok) {
      console.log('\n🎉 SUCCESS! NFT Generated and Minted');
      console.log('═══════════════════════════════════════\n');
      
      if (result.data) {
        console.log('🖼️  NFT Metadata:');
        console.log(`   Name: ${result.data.nftMetadata?.name}`);
        console.log(`   Description: ${result.data.nftMetadata?.description?.substring(0, 100)}...`);
        
        if (result.data.nftMetadata?.attributes) {
          console.log('\n🏷️  Attributes:');
          result.data.nftMetadata.attributes.forEach(attr => {
            console.log(`   ${attr.trait_type}: ${attr.value}`);
          });
        }

        console.log('\n⛓️  Blockchain Details:');
        console.log(`   Transaction Hash: ${result.data.transactionHash}`);
        console.log(`   Token ID: ${result.data.tokenId}`);
        console.log(`   Contract: ${result.data.contractAddress}`);
        console.log(`   Minted To: ${result.data.mintedTo}`);
        
        if (result.data.polygonScanUrl) {
          console.log(`   PolygonScan: ${result.data.polygonScanUrl}`);
        }

        console.log('\n📸 Image:');
        console.log(`   URL: ${result.data.nftMetadata?.image}`);
      }
      
      console.log('\n✅ Test completed successfully!');
      
    } else {
      console.log('\n❌ FAILED! Error response:');
      console.log('═══════════════════════════════════════\n');
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('\n💥 ERROR during API call:');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js server is running with: npm run dev');
    }
  }
}

// Run the test
testGenerateAndMint().catch(console.error);