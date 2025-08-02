# NFT Infrastructure Setup

This directory contains the basic NFT infrastructure for the healthcare rehabilitation app.

## Setup Steps

### 1. Environment Variables
Make sure your `.env.local` file contains:
```
THIRDWEB_CLIENT_ID=9a7ca60bcfc261ffd59c01cf528475eb
THIRDWEB_SECRET_KEY=X0XjkhC0PMaP_pIRc80xA86vtWKl-PBFjU3w_ozo8hA2sEGegD5wodUQiGEIIU84a6Ghj9CyzxN3BJZ3V-FxsA
TEST_WALLET_ADDRESS=0xb1c631b25935bD4C10271ebbD989E439e8DC37b4
NETWORK=mumbai
NFT_CONTRACT_ADDRESS=your_contract_address_here
```

### 2. Deploy NFT Contract
Before you can mint NFTs, you need to deploy a contract:

1. Go to [thirdweb dashboard](https://thirdweb.com/dashboard)
2. Connect your wallet
3. Create a new NFT Drop contract on Polygon Mumbai testnet
4. Copy the contract address and add it to your `.env.local` as `NFT_CONTRACT_ADDRESS`

### 3. Test the Setup

First, test the thirdweb connection:
```bash
npm run dev
```

Then in another terminal:
```bash
# Test connection
curl http://localhost:3000/api/nft/test-connection

# Test minting (after deploying contract)
curl -X POST http://localhost:3000/api/nft/mint-test \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0xb1c631b25935bD4C10271ebbD989E439e8DC37b4"}'
```

Or use the test script:
```bash
npm run test:nft
```

## API Endpoints

### `/api/nft/test-connection` (GET)
Tests the thirdweb SDK connection and configuration.

### `/api/nft/mint-test` (POST)
Mints a test NFT to verify the contract integration works.

**Request Body:**
```json
{
  "walletAddress": "0x..." // Optional, uses TEST_WALLET_ADDRESS if not provided
}
```

**Response:**
```json
{
  "success": true,
  "message": "NFT minted successfully!",
  "transactionHash": "0x...",
  "tokenId": "1"
}
```

## Next Steps for Future Commits

1. **Commit 2**: Integrate Gemini API for dynamic NFT image generation
2. **Commit 3**: Connect to exercise completion flow 
3. **Commit 4**: Add frontend UI for wallet connection and NFT display

## File Structure

```
src/
├── lib/
│   └── thirdweb.ts          # ThirdwebSDK configuration
├── pages/api/nft/
│   ├── test-connection.ts   # Connection testing endpoint
│   └── mint-test.ts         # NFT minting endpoint
scripts/
└── test-mint.js             # Test script for minting
```

## Troubleshooting

- **"Missing required environment variables"**: Check that all variables in `.env.local` are set
- **"NFT contract not deployed yet"**: Deploy a contract using thirdweb dashboard
- **Network errors**: Make sure you're using Mumbai testnet and have test MATIC
