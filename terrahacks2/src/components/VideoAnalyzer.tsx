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
  const [selectedExercise, setSelectedExercise] = useState<string>('squat');
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
          mimeType: selectedFile.type,
          exerciseType: selectedExercise
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
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      color: '#000000',
      backgroundColor: '#ffffff'
    }}>
      <h1 style={{ color: '#000000' }}>Exercise Video Analyzer</h1>
      
      {/* Exercise Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#000000', fontSize: '16px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
          Select Exercise Type:
        </label>
        <select 
          value={selectedExercise} 
          onChange={(e) => setSelectedExercise(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            color: '#000000',
            cursor: 'pointer',
            minWidth: '200px'
          }}
        >
          <optgroup label="Lower Body">
            <option value="squat">Squats</option>
            <option value="deadlift">Deadlifts</option>
            <option value="lunge">Lunges</option>
            <option value="bulgariansplit">Bulgarian Split Squats</option>
            <option value="calfraiser">Calf Raises</option>
            <option value="glute-bridge">Glute Bridges</option>
            <option value="wall-sit">Wall Sits</option>
          </optgroup>
          <optgroup label="Upper Body - Push">
            <option value="pushup">Push-ups</option>
            <option value="benchpress">Bench Press</option>
            <option value="shoulderpress">Shoulder Press</option>
            <option value="dips">Dips</option>
            <option value="pike-pushup">Pike Push-ups</option>
          </optgroup>
          <optgroup label="Upper Body - Pull">
            <option value="pullup">Pull-ups</option>
            <option value="chinup">Chin-ups</option>
            <option value="row">Rows</option>
            <option value="lat-pulldown">Lat Pulldowns</option>
            <option value="bicep-curl">Bicep Curls</option>
          </optgroup>
          <optgroup label="Core & Stability">
            <option value="plank">Plank</option>
            <option value="side-plank">Side Plank</option>
            <option value="mountain-climber">Mountain Climbers</option>
            <option value="russian-twist">Russian Twists</option>
            <option value="dead-bug">Dead Bug</option>
            <option value="bird-dog">Bird Dog</option>
          </optgroup>
          <optgroup label="Full Body & Cardio">
            <option value="burpee">Burpees</option>
            <option value="jumping-jack">Jumping Jacks</option>
            <option value="high-knees">High Knees</option>
            <option value="jump-squat">Jump Squats</option>
            <option value="thruster">Thrusters</option>
            <option value="turkish-getup">Turkish Get-ups</option>
          </optgroup>
          <optgroup label="Olympic & Compound">
            <option value="clean">Clean</option>
            <option value="snatch">Snatch</option>
            <option value="clean-and-jerk">Clean and Jerk</option>
            <option value="overhead-squat">Overhead Squat</option>
          </optgroup>
          <optgroup label="Flexibility & Mobility">
            <option value="yoga-pose">Yoga Poses</option>
            <option value="stretching">Stretching</option>
            <option value="foam-rolling">Foam Rolling</option>
          </optgroup>
          <optgroup label="Other">
            <option value="other">Other Exercise</option>
            <option value="custom">Custom Analysis</option>
          </optgroup>
        </select>
      </div>
      
      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '20px',
          cursor: 'pointer',
          backgroundColor: '#f9f9f9',
          color: '#000000'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {selectedFile ? (
          <p>Selected: {selectedFile.name}</p>
        ) : (
          <p>Click here or drag and drop a video file (.mp4, .mov, .avi, .webm, etc.)</p>
        )}
      </div>

      {/* Video Preview */}
      {videoPreview && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#000000' }}>Video Preview:</h3>
          <video
            src={videoPreview}
            controls
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      )}

      {/* Analyze Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={analyzeVideo}
          disabled={!selectedFile || isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: selectedFile && !isLoading ? '#0070f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedFile && !isLoading ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Video'}
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{ textAlign: 'center', marginBottom: '20px', color: '#000000' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #0070f3',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{ color: '#000000' }}>Analyzing your squat video...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #fcc'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#000000' }}>Analysis Results:</h3>
          <div style={{
            backgroundColor: '#f8f8f8',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '16px',
            maxHeight: '400px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#000000'
          }}>
            {analysis}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
