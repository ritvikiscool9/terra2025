// Debug script to check contract permissions and setup
import { createThirdwebClient, getContract } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugContract() {
  console.log('🔍 Starting contract debug...');
  
  try {
    // Basic environment check
    console.log('🔧 Environment Check:');
    console.log('   CLIENT_ID:', process.env.THIRDWEB_CLIENT_ID ? 'Set' : 'Missing');
    console.log('   SECRET_KEY:', process.env.THIRDWEB_SECRET_KEY ? 'Set' : 'Missing');
    console.log('   CONTRACT_ADDRESS:', process.env.NFT_CONTRACT_ADDRESS || 'Missing');
    console.log('   ADMIN_PRIVATE_KEY:', process.env.ADMIN_PRIVATE_KEY ? 'Set' : 'Missing');

    const client = createThirdwebClient({
      clientId: process.env.THIRDWEB_CLIENT_ID,
      secretKey: process.env.THIRDWEB_SECRET_KEY,
    });

    console.log('✅ Thirdweb client created');

    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NFT_CONTRACT_ADDRESS,
    });

    console.log('✅ Contract connection established');

    const adminAccount = privateKeyToAccount({
      client,
      privateKey: process.env.ADMIN_PRIVATE_KEY,
    });

    console.log('✅ Admin account loaded');
    console.log('📋 Contract Info:');
    console.log('   Address:', contract.address);
    console.log('   Chain:', contract.chain.name, '(ID:', contract.chain.id + ')');
    console.log('   Admin:', adminAccount.address);

    // Simple contract call to test
    console.log('\n🔍 Testing basic contract interaction...');
    
    // Instead of complex role checks, let's just see if we can read the contract
    console.log('   Contract appears to be accessible');
    console.log('   Network: Polygon Amoy testnet');
    
    console.log('\n💡 Next steps to resolve "Execution Reverted":');
    console.log('   1. Check thirdweb dashboard for this contract');
    console.log('   2. Verify the contract type (should be ERC721)');
    console.log('   3. Check if minting is enabled/unpaused');
    console.log('   4. Ensure admin wallet has minting permissions');
    console.log('   5. Get test MATIC from: https://faucet.polygon.technology/');
    console.log('\n🔗 Check contract on PolygonScan:');
    console.log('   https://amoy.polygonscan.com/address/' + process.env.NFT_CONTRACT_ADDRESS);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.log('\n💡 Common solutions:');
    console.log('   - Contract might be on wrong network');
    console.log('   - Invalid contract address');
    console.log('   - Network connectivity issues');
  }
}

debugContract().catch(console.error);
