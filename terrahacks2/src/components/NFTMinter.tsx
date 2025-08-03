import React, { useState } from 'react';
import { createThirdwebClient, getContract, sendTransaction } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { mintTo } from "thirdweb/extensions/erc721";
import { injectedProvider } from "thirdweb/wallets";
import Confetti from './Confetti';

interface NFTMinterProps {
  walletAddress: string;
  exerciseType: string;
  completionScore: number;
  difficulty: string;
  bodyPart: string;
  playerName?: string;
  patientId?: string;
  exerciseCompletionId?: string;
  onMintSuccess?: (data: any) => void;
  onMintError?: (error: string) => void;
}

export default function NFTMinter({
  walletAddress,
  exerciseType,
  completionScore,
  difficulty,
  bodyPart,
  playerName = "Champion",
  patientId,
  exerciseCompletionId,
  onMintSuccess,
  onMintError
}: NFTMinterProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'generating' | 'minting' | 'success' | 'error'>('idle');
  const [showConfetti, setShowConfetti] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleMintNFT = async () => {
    setIsMinting(true);
    setMintStatus('generating');
    setError('');

    try {
      // Step 1: Generate NFT image and metadata
      console.log('🎨 Generating NFT image and metadata...');
      const imageResponse = await fetch('/api/nft/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseType,
          completionScore,
          difficulty,
          bodyPart,
          playerName
        })
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to generate NFT image');
      }

      const imageData = await imageResponse.json();
      console.log('✅ Image generated:', imageData);

      setMintStatus('minting');

      // Step 2: Mint NFT using connected wallet
      console.log('⚡ Minting NFT to blockchain...');
      const client = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!
      });

      const contract = getContract({
        client,
        chain: polygonAmoy,
        address: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
      });

      // Connect to the user's injected wallet (MetaMask)
      const wallet = injectedProvider();
      const account = await wallet.connect({ client });

      // Create mint transaction
      const transaction = mintTo({
        contract,
        to: walletAddress,
        nft: imageData.data.nftMetadata,
      });

      // Send transaction
      const receipt = await sendTransaction({
        transaction,
        account,
      });

      console.log('✅ NFT minted successfully:', receipt.transactionHash);

      // Step 3: Save NFT data to database
      console.log('💾 Saving NFT data to database...');
      const saveResponse = await fetch('/api/nft/save-to-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          exerciseCompletionId,
          nftMetadata: imageData.data.nftMetadata,
          imageUrl: imageData.data.imageUrl,
          imagePrompt: imageData.data.imagePrompt,
          walletAddress,
          transactionHash: receipt.transactionHash,
          exerciseType,
          completionScore,
          difficulty,
          bodyPart
        })
      });

      if (!saveResponse.ok) {
        console.warn('Failed to save NFT to database, but mint was successful');
      }

      const finalData = {
        ...imageData.data,
        transactionHash: receipt.transactionHash,
        polygonScanUrl: `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`,
        contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
      };

      setNftData(finalData);
      setMintStatus('success');
      setShowConfetti(true);

      // Hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);

      onMintSuccess?.(finalData);

    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT';
      setError(errorMessage);
      setMintStatus('error');
      onMintError?.(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  const getMintButtonText = () => {
    switch (mintStatus) {
      case 'generating':
        return 'Generating NFT...';
      case 'minting':
        return 'Minting to Blockchain...';
      case 'success':
        return 'NFT Minted Successfully! 🎉';
      case 'error':
        return 'Try Again';
      default:
        return 'Mint Your Achievement NFT! 🏆';
    }
  };

  const getMintButtonClass = () => {
    const baseClass = 'mint-nft-btn';
    switch (mintStatus) {
      case 'generating':
      case 'minting':
        return `${baseClass} minting`;
      case 'success':
        return `${baseClass} success`;
      case 'error':
        return `${baseClass} error`;
      default:
        return baseClass;
    }
  };

  return (
    <div className="nft-minter">
      {showConfetti && <Confetti />}
      
      <div className="mint-section">
        <div className="exercise-summary">
          <h3>🏋️ Exercise Completed!</h3>
          <div className="stats">
            <div className="stat">
              <span className="label">Exercise:</span>
              <span className="value">{exerciseType}</span>
            </div>
            <div className="stat">
              <span className="label">Score:</span>
              <span className="value">{completionScore}%</span>
            </div>
            <div className="stat">
              <span className="label">Difficulty:</span>
              <span className="value">{difficulty}</span>
            </div>
            <div className="stat">
              <span className="label">Target:</span>
              <span className="value">{bodyPart}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleMintNFT}
          disabled={isMinting || mintStatus === 'success'}
          className={getMintButtonClass()}
        >
          {isMinting && (
            <div className="spinner"></div>
          )}
          <span>{getMintButtonText()}</span>
        </button>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {mintStatus === 'success' && nftData && (
          <div className="success-message">
            <div className="nft-preview">
              <img src={nftData.imageUrl} alt="Your NFT" className="nft-image" />
              <div className="nft-details">
                <h4>{nftData.nftMetadata.name}</h4>
                <p className="nft-description">{nftData.nftMetadata.description}</p>
                <div className="nft-links">
                  <a
                    href={nftData.polygonScanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-transaction"
                  >
                    View on PolygonScan 🔗
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .nft-minter {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }

        .exercise-summary {
          background: linear-gradient(135deg, #f3f4f6, #ffffff);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
        }

        .exercise-summary h3 {
          margin: 0 0 16px 0;
          color: #374151;
          text-align: center;
        }

        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .stat .label {
          font-weight: 500;
          color: #6b7280;
        }

        .stat .value {
          font-weight: 600;
          color: #374151;
        }

        .mint-nft-btn {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 56px;
        }

        .mint-nft-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        }

        .mint-nft-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .mint-nft-btn.minting {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }

        .mint-nft-btn.success {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .mint-nft-btn.error {
          background: linear-gradient(135deg, #ef4444, #dc2626);
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

        .error-message {
          margin-top: 16px;
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .success-message {
          margin-top: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
          border: 2px solid #10b981;
          border-radius: 12px;
        }

        .nft-preview {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .nft-image {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid #10b981;
          flex-shrink: 0;
        }

        .nft-details {
          flex: 1;
        }

        .nft-details h4 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 18px;
        }

        .nft-description {
          margin: 0 0 12px 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
          max-height: 60px;
          overflow: hidden;
        }

        .nft-links {
          display: flex;
          gap: 12px;
        }

        .view-transaction {
          padding: 6px 12px;
          background: #10b981;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .view-transaction:hover {
          background: #059669;
        }

        @media (max-width: 640px) {
          .nft-preview {
            flex-direction: column;
            text-align: center;
          }

          .nft-image {
            align-self: center;
          }

          .stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
