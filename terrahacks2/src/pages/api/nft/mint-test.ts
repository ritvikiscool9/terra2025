// pages/api/nft/mint-test.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getThirdwebSDK } from '../../../lib/thirdweb';

interface MintResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
  tokenId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MintResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  try {
    console.log('🚀 Starting NFT mint test...');
    
    // Get wallet address from request body or use test wallet
    const { walletAddress } = req.body;
    const targetWallet = walletAddress || process.env.TEST_WALLET_ADDRESS;

    if (!targetWallet) {
      return res.status(400).json({
        success: false,
        message: 'No wallet address provided',
        error: 'Wallet address is required'
      });
    }

    console.log('🎯 Target wallet:', targetWallet);

    // Initialize ThirdwebSDK
    const sdk = getThirdwebSDK();
    console.log('✅ ThirdwebSDK initialized');

    // For this test, we'll use a simple image URL
    // In production, this would come from Gemini API image generation
    const testMetadata = {
      name: "Rehab Achievement Test #1",
      description: "Test NFT for rehabilitation app - Exercise completion proof",
      image: "https://via.placeholder.com/512x512.png?text=Rehab+Achievement", // Placeholder image
      attributes: [
        {
          trait_type: "Exercise Type",
          value: "Test Exercise"
        },
        {
          trait_type: "Completion Date",
          value: new Date().toISOString().split('T')[0]
        },
        {
          trait_type: "Form Score",
          value: "95"
        }
      ]
    };

    console.log('📋 Metadata prepared:', JSON.stringify(testMetadata, null, 2));

    // NOTE: You'll need to deploy an NFT contract first using thirdweb dashboard
    // For now, this will help you test the setup
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      return res.status(500).json({
        success: false,
        message: 'NFT contract not deployed yet',
        error: 'Please deploy an NFT contract using thirdweb dashboard and add NFT_CONTRACT_ADDRESS to .env.local'
      });
    }

    // Get the NFT contract
    const contract = await sdk.getContract(contractAddress);
    console.log('📄 Contract loaded:', contractAddress);

    // Mint the NFT
    console.log('⚡ Attempting to mint NFT...');
    const mintResult = await contract.erc721.mintTo(targetWallet, testMetadata);
    
    console.log('🎉 NFT minted successfully!');
    console.log('Transaction Hash:', mintResult.receipt.transactionHash);
    console.log('Token ID:', mintResult.id.toString());

    return res.status(200).json({
      success: true,
      message: 'NFT minted successfully!',
      transactionHash: mintResult.receipt.transactionHash,
      tokenId: mintResult.id.toString()
    });

  } catch (error) {
    console.error('❌ Minting failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to mint NFT',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
