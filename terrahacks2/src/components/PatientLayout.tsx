import { useState } from 'react';
import PatientSidebar from './PatientSidebar';
import VideoAnalyzer from './VideoAnalyzer';

interface PatientLayoutProps {
  initialPage?: string;
}

export default function PatientLayout({ initialPage = 'workout' }: PatientLayoutProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const renderContent = () => {
    switch (currentPage) {
      case 'workout':
        return <VideoAnalyzer />;
      case 'routines':
        return (
          <div style={{
            padding: '40px',
            backgroundColor: '#f8fafc',
            minHeight: '100vh'
          }}>
            {/* Header */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              marginBottom: '30px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px', marginRight: '12px' }}>📋</span>
                <h1 style={{ 
                  color: '#1e40af', 
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: '0'
                }}>
                  My Exercise Routines
                </h1>
              </div>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '16px', 
                margin: '0',
                lineHeight: '1.5'
              }}>
                View and track the exercise routines prescribed by your healthcare provider.
              </p>
            </div>

            {/* Active Routines */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              marginBottom: '20px'
            }}>
              <h2 style={{
                color: '#374151',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '20px',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '12px'
              }}>
                Active Routines
              </h2>
              
              {/* Sample Routine Card */}
              <div style={{
                border: '2px solid #dbeafe',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px',
                backgroundColor: '#f0f9ff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{
                    color: '#1e40af',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0'
                  }}>
                    Upper Body Rehabilitation
                  </h3>
                  <span style={{
                    backgroundColor: '#22c55e',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    ACTIVE
                  </span>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                    <strong>Prescribed by:</strong> Dr. Smith
                  </p>
                  <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                    <strong>Frequency:</strong> 3 times per week
                  </p>
                  <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
                    <strong>Duration:</strong> Jan 15 - Mar 15, 2025
                  </p>
                </div>
                
                <p style={{ 
                  color: '#374151', 
                  fontSize: '14px', 
                  margin: '0 0 16px 0',
                  lineHeight: '1.4'
                }}>
                  Focus on shoulder mobility and strength recovery. Complete all exercises with proper form.
                </p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{
                    backgroundColor: '#1e40af',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    View Exercises
                  </button>
                  <button style={{
                    backgroundColor: 'transparent',
                    color: '#1e40af',
                    border: '2px solid #1e40af',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Start Session
                  </button>
                </div>
              </div>

              {/* No routines message (for when there are no active routines) */}
              <div style={{
                textAlign: 'center',
                padding: '40px',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                display: 'none' // Show this when no routines exist
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No Active Routines</h3>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0' }}>
                  Your doctor hasn't assigned any routines yet. Check back later or contact your healthcare provider.
                </p>
              </div>
            </div>

            {/* Medical Disclaimer */}
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
                <div>
                  <p style={{ 
                    color: '#92400e', 
                    fontSize: '14px', 
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    <strong>Medical Supervision Required:</strong> Always follow your doctor's instructions. 
                    Stop exercising if you experience pain or discomfort and consult your healthcare provider.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>👤</div>
              <h2 style={{ 
                color: '#374151', 
                marginBottom: '12px',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Patient Profile
              </h2>
              <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
                Manage your personal and medical information here.
              </p>
            </div>
          </div>
        );
      default:
        return <VideoAnalyzer />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <PatientSidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
      
      <div style={{
        flex: 1,
        marginLeft: '280px', // Account for sidebar width
        transition: 'margin-left 0.3s ease',
        overflow: 'auto'
      }}>
        {renderContent()}
      </div>
    </div>
  );
}
