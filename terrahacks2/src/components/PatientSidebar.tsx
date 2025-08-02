import { useState } from 'react';

interface PatientSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function PatientSidebar({ currentPage, onPageChange }: PatientSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'workout',
      label: 'Upload Workout',
      icon: '🏋️',
      description: 'Record or upload exercise videos'
    },
    {
      id: 'progress',
      label: 'Progress Tracking',
      icon: '📊',
      description: 'View your exercise progress'
    },
    {
      id: 'profile',
      label: 'Patient Profile',
      icon: '👤',
      description: 'Manage your health profile'
    }
  ];

  return (
    <div 
      style={{
        width: isCollapsed ? '80px' : '280px',
        height: '100vh',
        backgroundColor: '#ffffff',
        borderRight: '2px solid #e2e8f0',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
        transition: 'width 0.3s ease',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!isCollapsed && (
            <div>
              <h2 style={{
                margin: '0 0 4px 0',
                fontSize: '20px',
                fontWeight: '700',
                color: '#1e40af',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                RehabTrack
              </h2>
              <p style={{
                margin: '0',
                fontSize: '12px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Patient Portal
              </p>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              color: '#475569'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        padding: '20px 0'
      }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            style={{
              width: '100%',
              padding: isCollapsed ? '16px 12px' : '16px 20px',
              border: 'none',
              backgroundColor: currentPage === item.id ? '#eff6ff' : 'transparent',
              borderLeft: currentPage === item.id ? '4px solid #2563eb' : '4px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              marginBottom: '4px'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== item.id) {
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{
              fontSize: '20px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {item.icon}
            </div>
            
            {!isCollapsed && (
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: currentPage === item.id ? '#2563eb' : '#374151',
                  marginBottom: '2px'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: '1.3'
                }}>
                  {item.description}
                </div>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Patient Info Footer */}
      {!isCollapsed && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              👨‍⚕️
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '2px'
              }}>
                Patient Dashboard
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Supervised Care
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      {!isCollapsed && (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#fef3c7',
          borderTop: '1px solid #f59e0b',
          fontSize: '11px',
          color: '#92400e',
          lineHeight: '1.4'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            ⚠️ Medical Notice
          </div>
          <div>
            Always consult your healthcare provider before starting any exercise program.
          </div>
        </div>
      )}
    </div>
  );
}
