import React, { useState } from 'react';
import { connectWallet, getConnectedAccount } from '../lib/wallet';
import Confetti from './Confetti';

interface NFTClaimProps {
  exerciseType: string;
  completionScore: number;
  difficulty: string;
  bodyPart: string;
  patientName: string;
  patientId?: string;
  exerciseCompletionId?: string;
  onClaimComplete?: (nftData: any) => void;
}

export default function NFTClaim({
  exerciseType,
  completionScore,
  difficulty,
  bodyPart,
  patientName,
  patientId,
  exerciseCompletionId,
  onClaimComplete
}: NFTClaimProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [claimedNFT, setClaimedNFT] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      console.log('🔗 Wallet connected:', address);
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClaimNFT = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setIsClaiming(true);
    setError(null);
    
    try {
      console.log('🎨 Claiming NFT for exercise completion...');
      
      const response = await fetch('/api/nft/generate-and-mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          exerciseType,
          completionScore,
          difficulty,
          bodyPart,
          playerName: patientName,
          patientId,
          exerciseCompletionId
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ NFT claimed successfully!', result);
        setClaimedNFT(result.data);
        setShowConfetti(true);
        
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
        
        if (onClaimComplete) {
          onClaimComplete(result.data);
        }
      } else {
        throw new Error(result.message || 'Failed to claim NFT');
      }
    } catch (error) {
      console.error('❌ NFT claim failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to claim NFT');
    } finally {
      setIsClaiming(false);
    }
  };

  const checkWalletConnection = async () => {
    try {
      const address = await getConnectedAccount();
      if (address) {
        setWalletAddress(address);
      }
    } catch (error) {
      console.log('No wallet connected');
    }
  };

  // Check wallet connection on mount
  React.useEffect(() => {
    checkWalletConnection();
  }, []);

  return (
    <div style={{
      backgroundColor: 'white',
      border: '3px solid #22c55e',
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'center',
      boxShadow: '0 8px 25px rgba(34, 197, 94, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {showConfetti && <Confetti />}
      
      {/* Success State */}
      {claimedNFT ? (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <h3 style={{
            color: '#22c55e',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 12px 0'
          }}>
            NFT Claimed Successfully!
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            margin: '0 0 16px 0',
            lineHeight: '1.5'
          }}>
            Your personalized mole-themed achievement NFT has been minted to your wallet!
          </p>
          
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '2px solid #dbeafe',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h4 style={{ color: '#1e40af', margin: '0 0 8px 0' }}>
              {claimedNFT.nftMetadata.name}
            </h4>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>
              Score: {completionScore}% • {difficulty} • {bodyPart}
            </p>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>
              Rarity: {claimedNFT.nftMetadata.attributes.find((attr: any) => attr.trait_type === 'Rarity')?.value}
            </p>
          </div>
          
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>Transaction:</strong> {claimedNFT.transactionHash.slice(0, 10)}...
            </p>
            <a 
              href={claimedNFT.polygonScanUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1e40af',
                textDecoration: 'none',
                fontSize: '12px'
              }}
            >
              View on PolygonScan →
            </a>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
          <h3 style={{
            color: '#22c55e',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 12px 0'
          }}>
            Claim Your NFT Reward!
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            margin: '0 0 16px 0',
            lineHeight: '1.5'
          }}>
            Great job completing your {exerciseType} exercise with a {completionScore}% score! 
            Claim your personalized mole-themed NFT achievement.
          </p>
          
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '2px solid #dbeafe',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🐭</div>
            <h4 style={{ color: '#1e40af', margin: '0 0 8px 0' }}>
              {patientName}'s Mole Achievement
            </h4>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
              {exerciseType} • {completionScore}% Score • {difficulty} Level
            </p>
          </div>
          
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #fca5a5',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#dc2626', fontSize: '14px', margin: '0' }}>
                {error}
              </p>
            </div>
          )}
          
          {!walletAddress ? (
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              style={{
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto',
                opacity: isConnecting ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isConnecting ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Connecting...
                </>
              ) : (
                <>
                  🦊 Connect MetaMask
                </>
              )}
            </button>
          ) : (
            <div>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '14px', 
                margin: '0 0 16px 0' 
              }}>
                Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
              
              <button
                onClick={handleClaimNFT}
                disabled={isClaiming}
                style={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: isClaiming ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  opacity: isClaiming ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isClaiming ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Claiming NFT...
                  </>
                ) : (
                  <>
                    🎨 Claim NFT Reward
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
