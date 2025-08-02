// Test script for basic NFT minting functionality
// Run with: npm run test:nft
import { createThirdwebClient, getContract, sendTransaction } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { mintTo } from "thirdweb/extensions/erc721";
import { privateKeyToAccount } from "thirdweb/wallets";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testThirdwebConnection() {
  console.log('🔄 Testing thirdweb v5 connection...');
  
  try {
    // Create thirdweb client (v5 syntax)
    const client = createThirdwebClient({
      clientId: process.env.THIRDWEB_CLIENT_ID,
      secretKey: process.env.THIRDWEB_SECRET_KEY,
    });

    console.log('✅ Thirdweb v5 client initialized successfully');
    console.log('📊 Network: Polygon Amoy testnet');
    console.log('🔑 Client ID:', process.env.THIRDWEB_CLIENT_ID?.substring(0, 8) + '...');
    
    return client;
  } catch (error) {
    console.error('❌ Error initializing thirdweb:', error);
    process.exit(1);
  }
}

async function testActualMinting() {
  console.log('\n🚀 Starting REAL NFT minting test...');
  
  try {
    const client = await testThirdwebConnection();
    
    console.log('🎯 Test wallet address:', process.env.TEST_WALLET_ADDRESS);
    
    if (!process.env.NFT_CONTRACT_ADDRESS) {
      console.error('❌ NFT_CONTRACT_ADDRESS not found in .env.local');
      return;
    }
    
    if (!process.env.ADMIN_PRIVATE_KEY) {
      console.error('❌ ADMIN_PRIVATE_KEY not found in .env.local');
      return;
    }
    
    console.log('\n🔄 Setting up contract and wallet...');
    
    // Debug: Verify contract address
    console.log('🔍 Debug Info:');
    console.log('   Contract Address from env:', process.env.NFT_CONTRACT_ADDRESS);
    console.log('   Expected Contract:', '0x15bfFBC29124dF7609039c3d8AEc946d2053c8Bf');
    console.log('   Addresses match:', process.env.NFT_CONTRACT_ADDRESS === '0x15bfFBC29124dF7609039c3d8AEc946d2053c8Bf');
    
    // Get the contract
    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NFT_CONTRACT_ADDRESS,
    });
    
    console.log('✅ Contract connection established');
    console.log('📄 Contract address:', process.env.NFT_CONTRACT_ADDRESS);
    console.log('🌐 Network:', polygonAmoy.name, '(Chain ID:', polygonAmoy.id + ')');
    
    // Create admin account from private key
    const adminAccount = privateKeyToAccount({
      client,
      privateKey: process.env.ADMIN_PRIVATE_KEY,
    });
    
    console.log('✅ Admin wallet loaded');
    console.log('👤 Admin address:', adminAccount.address);
    
    console.log('\n🎨 Preparing test NFT metadata...');
    
    // Test NFT metadata with generated image
    const nftMetadata = {
      name: "Healthcare Rehab Achievement #1",
      description: "Test NFT for completing rehabilitation exercises - Generated with Gemini AI",
      image: "http://localhost:3000/generated-nfts/nft-1754162025244.png", // Using the generated image
      attributes: [
        {
          trait_type: "Exercise Type",
          value: "Push-ups"
        },
        {
          trait_type: "Completion Score",
          value: "95"
        },
        {
          trait_type: "Date Completed",
          value: new Date().toISOString().split('T')[0]
        },
        {
          trait_type: "Generated Image",
          value: "Yes"
        }
      ]
    };
    
    console.log('📋 NFT Metadata prepared:');
    console.log('   Name:', nftMetadata.name);
    console.log('   Description:', nftMetadata.description);
    console.log('   Attributes:', nftMetadata.attributes.length, 'traits');
    
    console.log('\n⚡ Attempting to mint NFT...');
    console.log('   To:', process.env.TEST_WALLET_ADDRESS);
    console.log('   From:', adminAccount.address);
    
    // Attempt the mint using v5 syntax
    console.log('🔄 Sending transaction...');
    
    const transaction = mintTo({
      contract,
      to: process.env.TEST_WALLET_ADDRESS,
      nft: nftMetadata,
    });
    
    console.log('🔄 Executing transaction with admin account...');
    
    // Send the transaction with the admin account
    const receipt = await sendTransaction({
      transaction,
      account: adminAccount,
    });
    
    console.log('\n🎉 SUCCESS! NFT minted successfully!');
    console.log('📦 Transaction Hash:', receipt.transactionHash);
    console.log('⛽ Gas Used:', receipt.gasUsed?.toString());
    console.log('📊 Block Number:', receipt.blockNumber);
    
    if (receipt.transactionHash) {
      console.log('🔗 View on PolygonScan:', `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`);
    }
    
    console.log('🏆 NFT minted to:', process.env.TEST_WALLET_ADDRESS);
    console.log('📄 Using contract:', process.env.NFT_CONTRACT_ADDRESS);
    console.log('🆔 Check your NFTs in the thirdweb dashboard');
    
    console.log('\n✅ Complete NFT infrastructure test PASSED!');
    console.log('🚀 Ready for integration with rehabilitation app!');
    
  } catch (error) {
    console.error('\n❌ Minting failed:', error);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Solution: Add MATIC tokens to your admin wallet');
      console.log('   Get test MATIC from: https://faucet.polygon.technology/');
      console.log('   Admin wallet:', process.env.ADMIN_PRIVATE_KEY ? 'configured' : 'not configured');
    } else if (error.message.includes('unauthorized')) {
      console.log('\n💡 Solution: Make sure your admin wallet has minting permissions on the contract');
    }
    
    process.exit(1);
  }
}

// Run the test
testActualMinting().catch(console.error);