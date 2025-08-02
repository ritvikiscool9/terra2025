// lib/thirdweb.ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

// Initialize ThirdwebSDK with your secret key for server-side operations
export function getThirdwebSDK() {
  if (!process.env.THIRDWEB_SECRET_KEY) {
    throw new Error("THIRDWEB_SECRET_KEY is not set in environment variables");
  }

  // Using Polygon Mumbai testnet for initial testing
  // You can change this to "polygon" for mainnet later
  const network = process.env.NETWORK || "mumbai";
  
  const sdk = ThirdwebSDK.fromPrivateKey(
    process.env.THIRDWEB_SECRET_KEY,
    network,
    {
      clientId: process.env.THIRDWEB_CLIENT_ID,
    }
  );

  return sdk;
}

// Contract helper function
export async function getNFTContract(contractAddress: string) {
  const sdk = getThirdwebSDK();
  return await sdk.getContract(contractAddress, "nft-drop");
}
