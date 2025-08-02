// Simple mint test with better error handling
import { createThirdwebClient, getContract, sendTransaction } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { mintTo } from "thirdweb/extensions/erc721";
import { privateKeyToAccount } from "thirdweb/wallets";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function simpleMintTest() {
  console.log('🧪 Simple mint test with detailed error handling...');
  
  try {
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

    console.log('✅ Setup complete');
    console.log('📄 Contract:', contract.address);
    console.log('👤 Admin:', adminAccount.address);

    // Try the simplest possible NFT metadata
    const simpleNFT = {
      name: "Test NFT #" + Date.now(),
      description: "Simple test NFT",
      image: "https://via.placeholder.com/400x400.png?text=Test+NFT"
    };

    console.log('\n🎯 Attempting simple mint...');
    console.log('   NFT:', simpleNFT.name);
    console.log('   To:', process.env.TEST_WALLET_ADDRESS);

    // Create the mint transaction
    const transaction = mintTo({
      contract,
      to: process.env.TEST_WALLET_ADDRESS,
      nft: simpleNFT,
    });

    console.log('📦 Transaction prepared, sending...');

    // Send with detailed error catching
    const receipt = await sendTransaction({
      transaction,
      account: adminAccount,
    });

    console.log('\n🎉 SUCCESS!');
    console.log('📦 Transaction Hash:', receipt.transactionHash);
    console.log('🔗 View on PolygonScan:', `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`);

  } catch (error) {
    console.error('\n❌ Detailed error analysis:');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    
    if (error.data) {
      console.error('Error Data:', error.data);
    }
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 SOLUTION: Get test MATIC');
      console.log('   1. Go to: https://faucet.polygon.technology/');
      console.log('   2. Connect wallet:', adminAccount.address);
      console.log('   3. Request test MATIC for Polygon Amoy');
    } else if (error.message.includes('execution reverted')) {
      console.log('\n💡 SOLUTION: Check contract permissions');
      console.log('   1. Go to: https://thirdweb.com/dashboard');
      console.log('   2. Find your contract:', process.env.NFT_CONTRACT_ADDRESS);
      console.log('   3. Go to Permissions tab');
      console.log('   4. Grant MINTER_ROLE to:', adminAccount.address);
    }
  }
}

simpleMintTest().catch(console.error);
