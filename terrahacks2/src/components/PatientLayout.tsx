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
                <span style={{ fontSize: '32px', marginRight: '12px' }}>👤</span>
                <h1 style={{ 
                  color: '#1e40af', 
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: '0'
                }}>
                  Patient Profile
                </h1>
              </div>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '16px', 
                margin: '0',
                lineHeight: '1.5'
              }}>
                Manage your personal and medical information. Keep your profile updated for better healthcare management.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {/* Personal Information */}
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h2 style={{
                  color: '#374151',
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '12px'
                }}>
                  Personal Information
                </h2>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      marginRight: '16px'
                    }}>
                      👤
                    </div>
                    <div>
                      <h3 style={{ color: '#1e40af', fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                        John Smith
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                        Patient ID: PAT-2025-001
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ 
                      color: '#374151', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      Email
                    </label>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '14px', 
                      margin: '0',
                      padding: '8px 0',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      john.smith@email.com
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      color: '#374151', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      Phone
                    </label>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '14px', 
                      margin: '0',
                      padding: '8px 0',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      (555) 123-4567
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      color: '#374151', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      Date of Birth
                    </label>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '14px', 
                      margin: '0',
                      padding: '8px 0',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      January 15, 1985
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      color: '#374151', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      Age
                    </label>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '14px', 
                      margin: '0',
                      padding: '8px 0',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      40 years old
                    </p>
                  </div>
                </div>

                <button style={{
                  backgroundColor: '#1e40af',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}>
                  Edit Personal Info
                </button>
              </div>

              {/* Medical Information */}
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h2 style={{
                  color: '#374151',
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '12px'
                }}>
                  Medical Information
                </h2>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Assigned Doctor
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #dbeafe'
                  }}>
                    <span style={{ fontSize: '20px', marginRight: '8px' }}>👨‍⚕️</span>
                    <div>
                      <p style={{ color: '#1e40af', fontSize: '14px', fontWeight: '500', margin: '0' }}>
                        Dr. Sarah Johnson
                      </p>
                      <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>
                        Orthopedic Specialist
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Medical Conditions
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #fecaca'
                    }}>
                      Shoulder Impingement
                    </span>
                    <span style={{
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #fecaca'
                    }}>
                      Lower Back Pain
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Current Medications
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #bbf7d0'
                    }}>
                      Ibuprofen 200mg
                    </span>
                    <span style={{
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #bbf7d0'
                    }}>
                      Physical Therapy
                    </span>
                  </div>
                </div>

                <button style={{
                  backgroundColor: 'transparent',
                  color: '#1e40af',
                  border: '2px solid #1e40af',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}>
                  Update Medical Info
                </button>
              </div>
            </div>

            {/* Emergency Contact & NFT Wallet */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
              {/* Emergency Contact */}
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h2 style={{
                  color: '#374151',
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '8px'
                }}>
                  Emergency Contact
                </h2>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    Name
                  </label>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                    Jane Smith (Spouse)
                  </p>
                </div>

                <div>
                  <label style={{ 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    Phone
                  </label>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                    (555) 123-4568
                  </p>
                </div>
              </div>

              {/* NFT Wallet */}
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h2 style={{
                  color: '#374151',
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '8px'
                }}>
                  NFT Rewards Wallet
                </h2>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    Wallet Address
                  </label>
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '12px', 
                    margin: '0',
                    fontFamily: 'monospace',
                    backgroundColor: '#f9fafb',
                    padding: '8px',
                    borderRadius: '4px',
                    wordBreak: 'break-all'
                  }}>
                    0x742d35Cc6Bf8...d6d6BB88
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #dbeafe'
                }}>
                  <p style={{ 
                    color: '#1e40af', 
                    fontSize: '12px', 
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    🏆 3 Achievement NFTs Earned
                  </p>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              marginTop: '30px'
            }}>
              <h2 style={{
                color: '#374151',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '8px'
              }}>
                Account Actions
              </h2>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button style={{
                  backgroundColor: '#1e40af',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Download Medical Records
                </button>
                
                <button style={{
                  backgroundColor: 'transparent',
                  color: '#1e40af',
                  border: '2px solid #1e40af',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Export Progress Data
                </button>
                
                <button style={{
                  backgroundColor: 'transparent',
                  color: '#dc2626',
                  border: '2px solid #dc2626',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Request Account Deletion
                </button>
              </div>
            </div>

            {/* Privacy Notice */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #2563eb',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>🔒</span>
                <div>
                  <p style={{ 
                    color: '#1e40af', 
                    fontSize: '14px', 
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    <strong>Privacy & Security:</strong> Your medical information is encrypted and compliant with HIPAA regulations. 
                    Only you and your assigned healthcare providers can access this data.
                  </p>
                </div>
              </div>
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
