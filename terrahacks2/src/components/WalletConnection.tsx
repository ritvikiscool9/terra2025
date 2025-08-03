import React, { useState, useEffect } from 'react';
import { connectWallet, disconnectWallet, getCurrentAccount, isWalletConnected } from '../lib/wallet';

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
}

export default function WalletConnection({ onWalletConnected, onWalletDisconnected }: WalletConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const connected = await isWalletConnected();
      if (connected) {
        const account = await getCurrentAccount();
        if (account) {
          setWalletAddress(account);
          setIsConnected(true);
          onWalletConnected?.(account);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      const account = await connectWallet();
      if (account) {
        setWalletAddress(account);
        setIsConnected(true);
        onWalletConnected?.(account);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setWalletAddress('');
      setIsConnected(false);
      onWalletDisconnected?.();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to disconnect wallet');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-connection">
      {!isConnected ? (
        <div className="connect-section">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="connect-wallet-btn"
          >
            {isConnecting ? (
              <div className="flex items-center">
                <div className="spinner"></div>
                <span className="ml-2">Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">🦊</span>
                <span>Connect MetaMask</span>
              </div>
            )}
          </button>
          
          {error && (
            <div className="error-message mt-2">
              ⚠️ {error}
            </div>
          )}
          
          <div className="wallet-info mt-3 text-sm text-gray-600">
            <p>Connect your MetaMask wallet to mint NFT rewards!</p>
            <p>Make sure you're on Polygon Amoy testnet.</p>
          </div>
        </div>
      ) : (
        <div className="connected-section">
          <div className="wallet-status">
            <div className="flex items-center justify-between">
              <div className="wallet-info">
                <div className="flex items-center">
                  <div className="connected-indicator"></div>
                  <span className="ml-2 font-medium">Connected</span>
                </div>
                <div className="wallet-address text-sm text-gray-600">
                  {formatAddress(walletAddress)}
                </div>
              </div>
              
              <button
                onClick={handleDisconnect}
                className="disconnect-btn"
              >
                Disconnect
              </button>
            </div>
          </div>
          
          {error && (
            <div className="error-message mt-2">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .wallet-connection {
          max-width: 400px;
          margin: 0 auto;
        }

        .connect-wallet-btn {
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
        }

        .connect-wallet-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #5855eb, #7c3aed);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .connect-wallet-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .wallet-status {
          background: white;
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 16px;
        }

        .connected-indicator {
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .disconnect-btn {
          padding: 6px 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .disconnect-btn:hover {
          background: #dc2626;
        }

        .error-message {
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
        }

        .wallet-info p {
          margin: 4px 0;
        }

        .flex {
          display: flex;
        }

        .items-center {
          align-items: center;
        }

        .justify-between {
          justify-content: space-between;
        }

        .ml-2 { margin-left: 8px; }
        .mr-2 { margin-right: 8px; }
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }

        .text-sm { font-size: 14px; }
        .text-gray-600 { color: #6b7280; }
        .font-medium { font-weight: 500; }
      `}</style>
    </div>
  );
}
