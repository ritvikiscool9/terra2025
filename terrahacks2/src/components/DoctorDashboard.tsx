import { useState, useEffect } from 'react';
import { supabase, Patient, ExerciseCompletion } from '../lib/supabase';

interface PatientWithStats extends Patient {
  totalExercises?: number;
  completedExercises?: number;
  nftCount?: number;
  lastActivity?: string;
}

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithStats | null>(null);
  const [patientCompletions, setPatientCompletions] = useState<ExerciseCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      setError('');

      // For demo purposes, we'll fetch all patients
      // In production, you'd filter by the logged-in doctor's ID
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      // Fetch exercise completion stats for each patient
      const patientsWithStats = await Promise.all(
        (patientsData || []).map(async (patient) => {
          const { data: completions } = await supabase
            .from('exercise_completions')
            .select('*')
            .eq('patient_id', patient.id);

          const totalExercises = completions?.length || 0;
          const completedExercises = completions?.filter(c => c.completion_status === 'completed').length || 0;
          const nftCount = completions?.filter(c => c.nft_minted).length || 0;
          const lastActivity = completions?.[0]?.completion_date || null;

          return {
            ...patient,
            totalExercises,
            completedExercises,
            nftCount,
            lastActivity
          };
        })
      );

      setPatients(patientsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientDetails = async (patient: PatientWithStats) => {
    try {
      setSelectedPatient(patient);
      
      // Fetch detailed exercise completions for this patient
      const { data: completions, error } = await supabase
        .from('exercise_completions')
        .select('*')
        .eq('patient_id', patient.id)
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setPatientCompletions(completions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient details');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#48bb78';
      case 'needs_improvement': return '#ed8936';
      case 'failed': return '#f56565';
      default: return '#718096';
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
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        
        {/* Header */}
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
            👨‍⚕️
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
            Doctor Dashboard
          </h1>
          <p style={{ 
            color: '#718096', 
            fontSize: '18px',
            margin: '0',
            lineHeight: '1.6'
          }}>
            Monitor your patients' progress and exercise completions
          </p>
        </div>

        {/* Loading State */}
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
              margin: '0'
            }}>
              Loading patients...
            </h4>
          </div>
        )}

        {/* Error State */}
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
              <strong style={{ display: 'block', marginBottom: '4px' }}>Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <div style={{ display: 'flex', gap: '30px', minHeight: '600px' }}>
            
            {/* Patients List */}
            <div style={{ 
              flex: selectedPatient ? '1' : '1',
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
                👥 My Patients ({patients.length})
              </h3>
              
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => fetchPatientDetails(patient)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: selectedPatient?.id === patient.id ? '2px solid #667eea' : '2px solid transparent',
                      backgroundColor: selectedPatient?.id === patient.id ? 'rgba(102, 126, 234, 0.05)' : '#f7fafc',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPatient?.id !== patient.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedPatient?.id !== patient.id) {
                        e.currentTarget.style.backgroundColor = '#f7fafc';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ 
                        color: '#2d3748', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        margin: '0'
                      }}>
                        {patient.first_name} {patient.last_name}
                      </h4>
                      <div style={{ 
                        backgroundColor: '#48bb78',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        🏆 {patient.nftCount} NFTs
                      </div>
                    </div>
                    
                    <p style={{ 
                      color: '#718096', 
                      fontSize: '14px',
                      margin: '0 0 8px 0'
                    }}>
                      📧 {patient.email}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#718096' }}>
                      <span>📊 {patient.completedExercises}/{patient.totalExercises} exercises</span>
                      {patient.lastActivity && (
                        <span>🕒 Last active: {formatDate(patient.lastActivity)}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {patients.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#718096'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <p>No patients assigned yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Details */}
            {selectedPatient && (
              <div style={{ 
                flex: '2',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}>
                    {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                  </div>
                  <div>
                    <h3 style={{ 
                      color: '#2d3748',
                      fontSize: '24px',
                      fontWeight: '600',
                      margin: '0 0 4px 0'
                    }}>
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h3>
                    <p style={{ color: '#718096', margin: '0' }}>
                      Patient ID: {selectedPatient.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                {/* Patient Info */}
                <div style={{ 
                  backgroundColor: '#f7fafc',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ color: '#2d3748', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                    📋 Patient Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <span style={{ color: '#718096', fontSize: '14px' }}>Email:</span>
                      <p style={{ color: '#2d3748', margin: '4px 0 0 0', fontWeight: '500' }}>{selectedPatient.email}</p>
                    </div>
                    {selectedPatient.phone && (
                      <div>
                        <span style={{ color: '#718096', fontSize: '14px' }}>Phone:</span>
                        <p style={{ color: '#2d3748', margin: '4px 0 0 0', fontWeight: '500' }}>{selectedPatient.phone}</p>
                      </div>
                    )}
                    {selectedPatient.date_of_birth && (
                      <div>
                        <span style={{ color: '#718096', fontSize: '14px' }}>Date of Birth:</span>
                        <p style={{ color: '#2d3748', margin: '4px 0 0 0', fontWeight: '500' }}>{formatDate(selectedPatient.date_of_birth)}</p>
                      </div>
                    )}
                    {selectedPatient.wallet_address && (
                      <div>
                        <span style={{ color: '#718096', fontSize: '14px' }}>Wallet Address:</span>
                        <p style={{ color: '#2d3748', margin: '4px 0 0 0', fontWeight: '500', fontSize: '12px' }}>
                          {selectedPatient.wallet_address.slice(0, 6)}...{selectedPatient.wallet_address.slice(-4)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exercise Completions */}
                <div>
                  <h4 style={{ 
                    color: '#2d3748', 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🏋️ Recent Exercise Completions ({patientCompletions.length})
                  </h4>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {patientCompletions.map((completion) => (
                      <div
                        key={completion.id}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          backgroundColor: '#f7fafc',
                          marginBottom: '12px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: getStatusColor(completion.completion_status)
                            }} />
                            <span style={{ 
                              color: '#2d3748', 
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {completion.completion_status.replace('_', ' ')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {completion.form_score && (
                              <span style={{ 
                                backgroundColor: completion.form_score >= 70 ? '#48bb78' : '#ed8936',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                Score: {completion.form_score}%
                              </span>
                            )}
                            {completion.nft_minted && (
                              <span style={{ fontSize: '16px' }}>🏆</span>
                            )}
                          </div>
                        </div>
                        
                        <p style={{ color: '#718096', fontSize: '14px', margin: '0' }}>
                          🕒 {formatDate(completion.completion_date)}
                        </p>
                        
                        {completion.doctor_feedback && (
                          <div style={{ 
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: 'rgba(102, 126, 234, 0.05)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#2d3748'
                          }}>
                            💬 <strong>Your feedback:</strong> {completion.doctor_feedback}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {patientCompletions.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#718096'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                        <p>No exercise completions yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
            Rehabilitation Management System • Built with Next.js & Supabase
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
