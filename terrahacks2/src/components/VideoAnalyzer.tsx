import { useEffect, useRef, useState } from 'react';

interface AnalysisResponse {
  analysis?: string;
  error?: string;
}

interface ExerciseContext {
  name?: string;
  description?: string;
  instructions?: string;
  category?: string;
  difficulty_level?: number;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
}

interface VideoAnalyzerProps {
  exerciseContext?: ExerciseContext;
}

export default function VideoAnalyzer({ exerciseContext }: VideoAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Function to format analysis text with proper styling
  const formatAnalysisText = (text: string) => {
    if (!text) return null;
    
    // Split text into lines and process each line
    const lines = text.split('\n');
    const formattedElements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        formattedElements.push(<br key={`br-${index}`} />);
        return;
      }
      
      // Check for headers (lines starting with **)
      if (line.match(/^\*\*.*\*\*\s*$/)) {
        const headerText = line.replace(/\*\*/g, '');
        formattedElements.push(
          <div key={index} style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e40af',
            marginTop: index > 0 ? '20px' : '0',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {headerText.includes('Great job') && '🎉 '}
            {headerText.includes('noticed') && '👁️ '}
            {headerText.includes('observations') && '🔍 '}
            {headerText.includes('Tips') && '💡 '}
            {headerText}
          </div>
        );
        return;
      }
      
      // Process bullet points and regular text
      let processedLine = line;
      
      // Handle bullet points
      if (line.trim().startsWith('- ')) {
        const bulletText = line.replace(/^-\s*/, '');
        formattedElements.push(
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '8px',
            paddingLeft: '16px'
          }}>
            <span style={{
              color: '#3b82f6',
              marginRight: '8px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>•</span>
            <span style={{
              color: '#374151',
              lineHeight: '1.6'
            }}>
              {formatInlineText(bulletText)}
            </span>
          </div>
        );
        return;
      }
      
      // Regular paragraph text
      if (line.trim()) {
        formattedElements.push(
          <p key={index} style={{
            color: '#374151',
            lineHeight: '1.6',
            margin: '0 0 12px 0'
          }}>
            {formatInlineText(line)}
          </p>
        );
      }
    });
    
    return <div>{formattedElements}</div>;
  };
  
  // Function to handle inline formatting (bold text, etc.)
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} style={{ color: '#1e40af', fontWeight: '600' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Ensure video element displays the stream when stream changes
  useEffect(() => {
    if (stream && videoRef.current && showCamera) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream, showCamera]);

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

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setError('');
      
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      setError('Unable to access camera. Please check permissions and try again.');
      console.error('Camera access error:', err);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCameraLoading(false);
    setIsRecording(false);
    setRecordingTime(0);
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  const startRecording = () => {
    if (!stream) return;

    try {
      // Try different MIME types for better compatibility
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/mp4';
          }
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const file = new File([blob], `workout-${Date.now()}.webm`, { type: mimeType });
        setSelectedFile(file);
        setVideoPreview(URL.createObjectURL(blob));
        setRecordedChunks(chunks);
        stopCamera();
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start countdown timer
      const timer = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 15) {
            clearInterval(timer);
            recorder.stop();
            return 15;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      setError('Recording failed. Your browser may not support video recording.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
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
          mimeType: selectedFile.type,
          exerciseContext
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
      padding: '40px',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {exerciseContext?.name && (
            <div style={{
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              padding: '12px 20px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'inline-block',
              marginBottom: '16px',
              border: '2px solid #3b82f6'
            }}>
              🎯 Recording: {exerciseContext.name}
              {exerciseContext.category && (
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '400',
                  marginLeft: '8px',
                  opacity: 0.8
                }}>
                  ({exerciseContext.category})
                </span>
              )}
            </div>
          )}
          
          {/* Exercise Context Details */}
          {exerciseContext && (
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '14px'
            }}>
              <h4 style={{ 
                color: '#1e40af', 
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                📋 Exercise Details:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {exerciseContext.description && (
                  <div style={{ color: '#000000' }}><strong>Description:</strong> {exerciseContext.description}</div>
                )}
                {exerciseContext.sets && (
                  <div style={{ color: '#000000' }}><strong>Sets:</strong> {exerciseContext.sets}</div>
                )}
                {exerciseContext.reps && (
                  <div style={{ color: '#000000' }}><strong>Reps:</strong> {exerciseContext.reps}</div>
                )}
                {exerciseContext.duration_seconds && (
                  <div style={{ color: '#000000' }}><strong>Duration:</strong> {exerciseContext.duration_seconds}s</div>
                )}
                {exerciseContext.difficulty_level && (
                  <div style={{ color: '#000000' }}><strong>Difficulty:</strong> Level {exerciseContext.difficulty_level}</div>
                )}
              </div>
              {exerciseContext.instructions && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '6px' }}>
                  <strong style={{ color: '#000000' }}>Instructions:</strong> <span style={{ color: '#000000' }}>{exerciseContext.instructions}</span>
                </div>
              )}
            </div>
          )}
          
          <div style={{
            width: '70px',
            height: '70px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
          }}>
            🏋️
          </div>
          <h1 style={{ 
            color: '#1e293b',
            fontSize: '2.2rem',
            fontWeight: '700',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Exercise Analysis
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            margin: '0',
            lineHeight: '1.6',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Record or upload your exercise videos for AI-powered form analysis and personalized feedback from your healthcare provider
          </p>
        </div>
        
        {/* Record or Upload Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px',
          gap: '12px'
        }}>
          <button
            onClick={() => !showCamera && !cameraLoading && startCamera()}
            disabled={showCamera || isRecording || cameraLoading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              background: showCamera ? '#2563eb' : cameraLoading ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: showCamera || isRecording || cameraLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: showCamera ? 0.7 : 1,
              boxShadow: !showCamera && !cameraLoading ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none'
            }}
          >
            {cameraLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Starting Camera...
              </>
            ) : (
              <>📹 {showCamera ? 'Camera Active' : 'Record Workout'}</>
            )}
          </button>
          
          {showCamera && (
            <button
              onClick={stopCamera}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ❌ Close Camera
            </button>
          )}
        </div>

        {/* Camera Interface */}
        {showCamera && (
          <div style={{
            backgroundColor: '#000000',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '30px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#1a1a1a'
            }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                controls={false}
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  backgroundColor: '#1a1a1a'
                }}
                onLoadedMetadata={() => {
                  // Ensure the video starts playing when metadata is loaded
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
              />
              
              {/* Recording Indicator */}
              {isRecording && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'pulse 1s infinite'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'white',
                    borderRadius: '50%'
                  }} />
                  REC {15 - recordingTime}s
                </div>
              )}

              {/* Timer Progress Bar */}
              {isRecording && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  width: `${(recordingTime / 15) * 100}%`,
                  height: '4px',
                  backgroundColor: '#e53e3e',
                  transition: 'width 1s linear'
                }} />
              )}
            </div>

            {/* Recording Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px',
              marginTop: '20px'
            }}>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                    border: '4px solid white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: '0 4px 12px rgba(229, 62, 62, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ⚫
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    background: '#4a5568',
                    border: '4px solid white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}
                >
                  ⏹️
                </button>
              )}
            </div>
            
            <p style={{
              color: 'white',
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '14px',
              opacity: 0.8
            }}>
              {isRecording ? 
                `Recording... ${15 - recordingTime} seconds remaining` : 
                'Click the red button to start recording (15 second limit)'
              }
            </p>
          </div>
        )}
        
        {/* File Upload Area */}
        {!showCamera && (
          <div>
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: '#4a5568',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                📁 Or Upload an Existing Video
              </h3>
            </div>
            
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
          </div>
        )}

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
              ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
              : '#e2e8f0',
            color: selectedFile && !isLoading ? 'white' : '#a0aec0',
            border: 'none',
            borderRadius: '50px',
            cursor: selectedFile && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: selectedFile && !isLoading 
              ? '0 8px 25px rgba(37, 99, 235, 0.3)' 
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
            fontSize: '15px',
            lineHeight: '1.6',
            backgroundColor: '#fafbfc'
          }}>
            {formatAnalysisText(analysis)}
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
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
