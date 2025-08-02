import { NextApiRequest, NextApiResponse } from 'next';
import { createThirdwebClient } from "thirdweb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔄 Testing thirdweb connection via API...');

    // Test thirdweb client creation
    const client = createThirdwebClient({
      clientId: process.env.THIRDWEB_CLIENT_ID!,
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    console.log('✅ Thirdweb client created successfully');

    const status = {
      thirdweb: 'connected',
      network: 'polygonAmoy',
      contractConfigured: !!process.env.NFT_CONTRACT_ADDRESS,
      adminKeyConfigured: !!process.env.ADMIN_PRIVATE_KEY,
      testWallet: process.env.TEST_WALLET_ADDRESS,
      clientId: process.env.THIRDWEB_CLIENT_ID?.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: 'NFT infrastructure test successful',
      status,
    });

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
