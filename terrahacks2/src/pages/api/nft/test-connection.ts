// pages/api/nft/test-connection.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getThirdwebSDK } from '../../../lib/thirdweb';

interface TestResponse {
  success: boolean;
  message: string;
  sdkVersion?: string;
  network?: string;
  clientId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET.',
    });
  }

  try {
    console.log('🔍 Testing thirdweb connection...');
    
    // Test environment variables
    const clientId = process.env.THIRDWEB_CLIENT_ID;
    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    const network = process.env.NETWORK || 'mumbai';

    if (!clientId || !secretKey) {
      return res.status(500).json({
        success: false,
        message: 'Missing required environment variables',
        error: 'THIRDWEB_CLIENT_ID and THIRDWEB_SECRET_KEY must be set'
      });
    }

    console.log('✅ Environment variables found');
    console.log('📡 Network:', network);
    console.log('🔑 Client ID:', clientId.substring(0, 8) + '...');

    // Initialize SDK
    const sdk = getThirdwebSDK();
    console.log('✅ ThirdwebSDK initialized successfully');

    // Test SDK functionality
    const wallet = sdk.getSigner();
    const address = await wallet?.getAddress();
    console.log('👛 SDK Wallet Address:', address);

    return res.status(200).json({
      success: true,
      message: 'Thirdweb connection successful!',
      network: network,
      clientId: clientId.substring(0, 8) + '...'
    });

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Thirdweb connection failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
