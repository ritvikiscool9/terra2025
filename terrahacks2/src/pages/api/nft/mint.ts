import { NextApiRequest, NextApiResponse } from 'next';
import { createThirdwebClient, getContract } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { mintTo } from "thirdweb/extensions/erc721";
import { privateKeyToAccount } from "thirdweb/wallets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting NFT mint process...');

    // Validate required environment variables
    if (!process.env.THIRDWEB_CLIENT_ID || !process.env.THIRDWEB_SECRET_KEY) {
      throw new Error('Missing thirdweb configuration');
    }

    if (!process.env.NFT_CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured');
    }

    if (!process.env.ADMIN_PRIVATE_KEY) {
      throw new Error('Admin private key not configured');
    }

    const { recipientAddress, metadata } = req.body;

    if (!recipientAddress || !metadata) {
      return res.status(400).json({ 
        error: 'Missing required fields: recipientAddress and metadata' 
      });
    }

    // Create thirdweb client
    const client = createThirdwebClient({
      clientId: process.env.THIRDWEB_CLIENT_ID,
      secretKey: process.env.THIRDWEB_SECRET_KEY,
    });

    console.log('✅ Thirdweb client created');

    // Get the contract
    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NFT_CONTRACT_ADDRESS,
    });

    console.log('✅ Contract connection established');

    // Create admin account from private key
    const adminAccount = privateKeyToAccount({
      client,
      privateKey: process.env.ADMIN_PRIVATE_KEY,
    });

    console.log('✅ Admin account created');

    // Mint the NFT
    const transaction = mintTo({
      contract,
      to: recipientAddress,
      nft: metadata,
    });

    const result = await transaction.send({ account: adminAccount });

    console.log('✅ NFT minted successfully!');
    console.log('📄 Transaction hash:', result.transactionHash);

    return res.status(200).json({
      success: true,
      transactionHash: result.transactionHash,
      message: 'NFT minted successfully',
    });

  } catch (error) {
    console.error('❌ NFT minting failed:', error);
    
    return res.status(500).json({
      error: 'NFT minting failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
