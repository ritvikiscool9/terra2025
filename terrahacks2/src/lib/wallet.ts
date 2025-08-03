// Wallet connection utilities for MetaMask integration
import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { createWallet, walletConnect, inAppWallet } from "thirdweb/wallets";

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
      selectedAddress?: string;
    };
  }
}

// Initialize the thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Define the chain (you can change this to your preferred chain)
export const chain = defineChain(11155111); // Sepolia testnet

// Create wallet instances
export const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  walletConnect(),
  inAppWallet({
    auth: {
      options: ["email", "google", "apple", "facebook"],
    },
  }),
];

// Get the NFT contract
export const getNFTContract = () => {
  return getContract({
    client,
    chain,
    address: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
  });
};

// Wallet connection state
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export const initialWalletState: WalletState = {
  isConnected: false,
  address: null,
  isConnecting: false,
  error: null,
};

// Connect to MetaMask wallet
export async function connectWallet(): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask to continue.');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect your wallet.');
    }

    return accounts[0];
  } catch (error) {
    console.error('Wallet connection error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect wallet');
  }
}

// Get currently connected account
export async function getConnectedAccount(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting connected account:', error);
    return null;
  }
}

// Check if wallet is connected
export async function isWalletConnected(): Promise<boolean> {
  const account = await getConnectedAccount();
  return !!account;
}
