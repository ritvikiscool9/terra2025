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
      case 'progress':
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
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
              <h2 style={{ 
                color: '#374151', 
                marginBottom: '12px',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Progress Tracking
              </h2>
              <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
                Your exercise progress and analytics will appear here.
              </p>
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
