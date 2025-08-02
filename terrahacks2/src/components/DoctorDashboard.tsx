import { useState, useEffect } from 'react';
import { supabase, Patient, ExerciseCompletion } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';

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

      console.log('Fetching patients from Supabase...');
      
      // For demo purposes, we'll use admin client to bypass RLS
      // In production, you'd use proper authentication
      const { data: patientsData, error: patientsError } = await supabaseAdmin
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { patientsData, patientsError });

      if (patientsError) throw patientsError;

      // Fetch exercise completion stats for each patient
      const patientsWithStats = await Promise.all(
        (patientsData || []).map(async (patient) => {
          console.log('Processing patient:', patient);
          const { data: completions } = await supabaseAdmin
            .from('exercise_completions')
            .select('*')
            .eq('patient_id', patient.id);

          console.log(`Completions for patient ${patient.id}:`, completions);

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

      console.log('Final patients with stats:', patientsWithStats);
      setPatients(patientsWithStats);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientDetails = async (patient: PatientWithStats) => {
    try {
      setSelectedPatient(patient);
      
      // Fetch detailed exercise completions for this patient
      const { data: completions, error } = await supabaseAdmin
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
      case 'completed': return '#22c55e';
      case 'needs_improvement': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
          <span style={{ fontSize: '32px', marginRight: '12px' }}>👨‍⚕️</span>
          <h1 style={{ 
            color: '#1e40af', 
            fontSize: '28px',
            fontWeight: '700',
            margin: '0'
          }}>
            Doctor Dashboard
          </h1>
        </div>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px', 
          margin: '0',
          lineHeight: '1.5'
        }}>
          Monitor your patients' progress and exercise completions.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #1e40af',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h4 style={{ 
            color: '#1e40af',
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
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'start' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
            <div>
              <p style={{ 
                color: '#b91c1c', 
                fontSize: '14px', 
                margin: '0',
                fontWeight: '500'
              }}>
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <div style={{ display: 'flex', gap: '30px' }}>
          
          {/* Patients List */}
          <div style={{ 
            flex: selectedPatient ? '1' : '1',
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            height: 'fit-content'
          }}>
            <h2 style={{
              color: '#374151',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '20px',
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: '12px'
            }}>
              My Patients ({patients.length})
            </h2>
            
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => fetchPatientDetails(patient)}
                  style={{
                    border: selectedPatient?.id === patient.id ? '2px solid #1e40af' : '2px solid #dbeafe',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '16px',
                    backgroundColor: selectedPatient?.id === patient.id ? '#dbeafe' : '#f0f9ff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPatient?.id !== patient.id) {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPatient?.id !== patient.id) {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h3 style={{
                      color: '#1e40af',
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: '0'
                    }}>
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <span style={{
                      backgroundColor: '#22c55e',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      🏆 {patient.nftCount} NFTs
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                      <strong>Email:</strong> {patient.email}
                    </p>
                    <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                      <strong>Progress:</strong> {patient.completedExercises}/{patient.totalExercises} exercises
                    </p>
                    {patient.lastActivity && (
                      <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
                        <strong>Last Active:</strong> {formatDate(patient.lastActivity)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {patients.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                  <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No Patients Assigned</h3>
                  <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0' }}>
                    You don't have any patients assigned yet. Check back later or contact your administrator.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Patient Details */}
          {selectedPatient && (
            <div style={{ 
              flex: '2',
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              height: 'fit-content'
            }}>
              <h2 style={{
                color: '#374151',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '20px',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '12px'
              }}>
                Patient Details
              </h2>

              {/* Patient Info Card */}
              <div style={{
                border: '2px solid #dbeafe',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                backgroundColor: '#f0f9ff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{
                    color: '#1e40af',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0'
                  }}>
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h3>
                  <span style={{
                    backgroundColor: '#22c55e',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    PATIENT
                  </span>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                    <strong>Email:</strong> {selectedPatient.email}
                  </p>
                  {selectedPatient.phone && (
                    <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                      <strong>Phone:</strong> {selectedPatient.phone}
                    </p>
                  )}
                  {selectedPatient.date_of_birth && (
                    <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                      <strong>Date of Birth:</strong> {formatDate(selectedPatient.date_of_birth)}
                    </p>
                  )}
                  {selectedPatient.wallet_address && (
                    <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
                      <strong>Wallet:</strong> {selectedPatient.wallet_address.slice(0, 6)}...{selectedPatient.wallet_address.slice(-4)}
                    </p>
                  )}
                </div>
                
                <p style={{ 
                  color: '#374151', 
                  fontSize: '14px', 
                  margin: '0 0 16px 0',
                  lineHeight: '1.4'
                }}>
                  Total Exercise Completions: {selectedPatient.totalExercises} | NFTs Earned: {selectedPatient.nftCount}
                </p>
              </div>

              {/* Exercise Completions */}
              <div>
                <h3 style={{
                  color: '#374151',
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>
                  Recent Exercise Completions ({patientCompletions.length})
                </h3>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {patientCompletions.map((completion) => (
                    <div
                      key={completion.id}
                      style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                        backgroundColor: '#f9fafb'
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
                            color: '#374151', 
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            fontSize: '14px'
                          }}>
                            {completion.completion_status.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {completion.form_score && (
                            <span style={{ 
                              backgroundColor: completion.form_score >= 70 ? '#22c55e' : '#f59e0b',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              Score: {completion.form_score}%
                            </span>
                          )}
                          {completion.nft_minted && (
                            <span style={{ fontSize: '16px' }}>🏆</span>
                          )}
                        </div>
                      </div>
                      
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                        <strong>Completed:</strong> {formatDate(completion.completion_date)}
                      </p>
                      
                      {completion.doctor_feedback && (
                        <div style={{ 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: '#dbeafe',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          <strong>Your feedback:</strong> {completion.doctor_feedback}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {patientCompletions.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                      <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No Exercise Completions</h3>
                      <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0' }}>
                        This patient hasn't completed any exercises yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medical Disclaimer */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '30px'
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
              <strong>Medical Supervision:</strong> Monitor patient progress closely and provide appropriate feedback. 
              Ensure patients follow proper form and safety guidelines during rehabilitation exercises.
            </p>
          </div>
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
