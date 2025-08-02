import { useRef, useState } from 'react';

interface AnalysisResponse {
  analysis?: string;
  error?: string;
}

export default function VideoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError('');
      setAnalysis('');
    } else {
      setError('Please select a valid video file (.mp4, .mov, .avi, .webm, etc.)');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError('');
      setAnalysis('');
    } else {
      setError('Please drop a valid video file (.mp4, .mov, .avi, .webm, etc.)');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (data:video/mp4;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeVideo = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const videoBase64 = await convertToBase64(selectedFile);

      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          videoBase64,
          mimeType: selectedFile.type
        }),
      });

      const data: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError('No analysis received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px'
          }}>
            🏋️
          </div>
          <h1 style={{ 
            color: '#2d3748',
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 0 10px 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            AI Exercise Analyzer
          </h1>
          <p style={{ 
            color: '#718096', 
            fontSize: '18px',
            margin: '0',
            lineHeight: '1.6'
          }}>
            Upload any exercise video and get instant AI-powered form analysis and feedback
          </p>
        </div>
        
        {/* File Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: selectedFile ? '3px solid #667eea' : '3px dashed #cbd5e0',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            marginBottom: '30px',
            cursor: 'pointer',
            backgroundColor: selectedFile ? 'rgba(102, 126, 234, 0.05)' : '#f7fafc',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={(e) => {
            if (!selectedFile) {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!selectedFile) {
              e.currentTarget.style.borderColor = '#cbd5e0';
              e.currentTarget.style.backgroundColor = '#f7fafc';
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <div style={{
            fontSize: '4rem',
            marginBottom: '20px',
            opacity: 0.7
          }}>
            {selectedFile ? '✅' : '📹'}
          </div>
          
          {selectedFile ? (
            <div>
              <p style={{ 
                color: '#667eea',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                ✨ Video Selected!
              </p>
              <p style={{ 
                color: '#4a5568',
                fontSize: '16px',
                margin: '0'
              }}>
                {selectedFile.name}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ 
                color: '#4a5568',
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 12px 0'
              }}>
                Drop your exercise video here
              </p>
              <p style={{ 
                color: '#718096',
                fontSize: '16px',
                margin: '0 0 20px 0'
              }}>
                or click to browse files
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                color: '#667eea'
              }}>
                📁 Supports: MP4, MOV, AVI, WEBM
              </div>
            </div>
          )}
        </div>

      {/* Video Preview */}
      {videoPreview && (
        <div style={{ 
          marginBottom: '30px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            color: '#2d3748',
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🎬 Video Preview
          </h3>
          <div style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <video
              src={videoPreview}
              controls
              style={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '40px' 
      }}>
        <button
          onClick={analyzeVideo}
          disabled={!selectedFile || isLoading}
          style={{
            padding: '16px 40px',
            fontSize: '18px',
            fontWeight: '600',
            background: selectedFile && !isLoading 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : '#e2e8f0',
            color: selectedFile && !isLoading ? 'white' : '#a0aec0',
            border: 'none',
            borderRadius: '50px',
            cursor: selectedFile && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: selectedFile && !isLoading 
              ? '0 8px 25px rgba(102, 126, 234, 0.3)' 
              : 'none',
            transform: 'scale(1)',
            minWidth: '200px'
          }}
          onMouseEnter={(e) => {
            if (selectedFile && !isLoading) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedFile && !isLoading) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
            }
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Analyzing...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              🤖 Analyze Video
            </span>
          )}
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '16px',
          padding: '40px 20px',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h4 style={{ 
            color: '#667eea',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            🤖 AI is analyzing your video...
          </h4>
          <p style={{ 
            color: '#718096',
            fontSize: '14px',
            margin: '0'
          }}>
            This may take a few moments depending on video length
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fed7d7',
          color: '#c53030',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid #feb2b2',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '24px' }}>⚠️</div>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Oops! Something went wrong</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div style={{ 
          marginBottom: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '24px' }}>📊</div>
            <h3 style={{ 
              fontSize: '20px',
              fontWeight: '600',
              margin: '0'
            }}>
              AI Analysis Results
            </h3>
          </div>
          <div style={{
            padding: '24px',
            maxHeight: '500px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: '15px',
            lineHeight: '1.7',
            color: '#2d3748',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          }}>
            {analysis}
          </div>
        </div>
      )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          color: '#718096',
          fontSize: '14px',
          borderTop: '1px solid #e2e8f0',
          marginTop: '40px'
        }}>
          <p style={{ margin: '0' }}>
            Powered by Google Gemini AI • Built with Next.js & React
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
