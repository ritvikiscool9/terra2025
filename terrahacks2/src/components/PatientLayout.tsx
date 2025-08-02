import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PatientSidebar from './PatientSidebar';
import VideoAnalyzer from './VideoAnalyzer';

interface PatientLayoutProps {
  initialPage?: string;
}

interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string[];
  current_medications: string[];
  nft_wallet_address: string;
  assigned_doctor_id: string;
  doctors?: {
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

export default function PatientLayout({ initialPage = 'workout' }: PatientLayoutProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [patientRoutines, setPatientRoutines] = useState<any[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [nftCount, setNftCount] = useState(0);

  useEffect(() => {
    if (currentPage === 'routines') {
      fetchPatientRoutines();
    }
    if (currentPage === 'profile') {
      fetchPatientData();
    }
  }, [currentPage]);

  const fetchPatientData = async () => {
    try {
      setIsLoadingPatient(true);
      
      // For demo purposes, we'll get the first patient
      // In production, you'd use the logged-in user's ID
      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          *,
          doctors(first_name, last_name, specialization)
        `)
        .limit(1);

      if (error) throw error;
      
      if (patients && patients.length > 0) {
        setPatientData(patients[0]);
        
        // Count NFTs (for demo, we'll simulate this)
        setNftCount(3);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setIsLoadingPatient(false);
    }
  };

  const fetchPatientRoutines = async () => {
    try {
      setIsLoadingRoutines(true);
      
      // For demo purposes, we'll get routines for all patients
      // In production, you'd filter by the logged-in patient's ID
      const { data: routines, error } = await supabase
        .from('routines')
        .select(`
          *,
          patients(first_name, last_name, email),
          doctors(first_name, last_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatientRoutines(routines || []);
    } catch (err) {
      console.error('Error fetching routines:', err);
    } finally {
      setIsLoadingRoutines(false);
    }
  };

  const fetchRoutineExercises = async (routineId: string) => {
    try {
      const { data: exercises, error } = await supabase
        .from('routine_exercises')
        .select(`
          *,
          exercises(name, description, instructions, category, difficulty_level)
        `)
        .eq('routine_id', routineId)
        .order('order_in_routine');

      if (error) throw error;
      setRoutineExercises(exercises || []);
    } catch (err) {
      console.error('Error fetching routine exercises:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

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
                My Assigned Routines ({patientRoutines.length})
              </h2>
              
              {isLoadingRoutines ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #1e40af',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                  }} />
                  <p style={{ color: '#6b7280' }}>Loading your routines...</p>
                </div>
              ) : patientRoutines.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No Routines Assigned</h3>
                  <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0' }}>
                    Your doctor hasn't assigned any routines yet. Check back later or contact your healthcare provider.
                  </p>
                </div>
              ) : (
                <div>
                  {patientRoutines.map((routine) => (
                    <div
                      key={routine.id}
                      style={{
                        border: '2px solid #dbeafe',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '16px',
                        backgroundColor: '#f0f9ff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <h3 style={{
                          color: '#1e40af',
                          fontSize: '18px',
                          fontWeight: '600',
                          margin: '0'
                        }}>
                          {routine.title}
                        </h3>
                        <span style={{
                          backgroundColor: routine.is_active ? '#22c55e' : '#6b7280',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {routine.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                          <strong>Prescribed by:</strong> Dr. {routine.doctors?.first_name} {routine.doctors?.last_name}
                        </p>
                        <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                          <strong>Frequency:</strong> {routine.frequency_per_week} times per week
                        </p>
                        <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
                          <strong>Start Date:</strong> {formatDate(routine.start_date)}
                          {routine.end_date && ` - ${formatDate(routine.end_date)}`}
                        </p>
                      </div>
                      
                      {routine.description && (
                        <p style={{ 
                          color: '#374151', 
                          fontSize: '14px', 
                          margin: '0 0 16px 0',
                          lineHeight: '1.4'
                        }}>
                          {routine.description}
                        </p>
                      )}
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => {
                            setSelectedRoutine(routine);
                            fetchRoutineExercises(routine.id);
                          }}
                          style={{
                            backgroundColor: '#1e40af',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          View Exercises
                        </button>
                        <button 
                          onClick={() => setCurrentPage('workout')}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#1e40af',
                            border: '2px solid #1e40af',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Start Session
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Routine Exercises Modal */}
            {selectedRoutine && (
              <div style={{
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '700px',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Modal Header */}
                  <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h2 style={{
                      color: '#1e40af',
                      fontSize: '24px',
                      fontWeight: '700',
                      margin: '0'
                    }}>
                      {selectedRoutine.title}
                    </h2>
                    <button
                      onClick={() => setSelectedRoutine(null)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                        <strong>Prescribed by:</strong> Dr. {selectedRoutine.doctors?.first_name} {selectedRoutine.doctors?.last_name}
                      </p>
                      <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
                        <strong>Frequency:</strong> {selectedRoutine.frequency_per_week} times per week
                      </p>
                      {selectedRoutine.description && (
                        <p style={{ color: '#374151', fontSize: '14px', marginTop: '12px' }}>
                          {selectedRoutine.description}
                        </p>
                      )}
                    </div>

                    <h3 style={{
                      color: '#374151',
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '16px'
                    }}>
                      Exercises ({routineExercises.length})
                    </h3>

                    {routineExercises.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                        Loading exercises...
                      </div>
                    ) : (
                      <div>
                        {routineExercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            style={{
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '16px',
                              marginBottom: '12px',
                              backgroundColor: '#f9fafb'
                            }}
                          >
                            <div style={{ marginBottom: '8px' }}>
                              <h4 style={{
                                color: '#1e40af',
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '0 0 4px 0'
                              }}>
                                {exercise.order_in_routine}. {exercise.exercise_templates?.name}
                              </h4>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                {exercise.exercise_templates?.category} • Level {exercise.exercise_templates?.difficulty_level}
                              </div>
                            </div>
                            
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                              gap: '12px',
                              marginBottom: '12px',
                              padding: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '6px'
                            }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Sets</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>{exercise.sets}</div>
                              </div>
                              {exercise.reps && (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Reps</div>
                                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>{exercise.reps}</div>
                                </div>
                              )}
                              {exercise.duration_seconds && (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Duration</div>
                                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>{exercise.duration_seconds}s</div>
                                </div>
                              )}
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Rest</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>{exercise.rest_seconds}s</div>
                              </div>
                            </div>

                            {exercise.exercise_templates?.instructions && (
                              <p style={{ 
                                color: '#374151', 
                                fontSize: '14px', 
                                margin: '0',
                                lineHeight: '1.4'
                              }}>
                                <strong>Instructions:</strong> {exercise.exercise_templates.instructions}
                              </p>
                            )}

                            {exercise.special_instructions && (
                              <p style={{ 
                                color: '#059669', 
                                fontSize: '14px', 
                                margin: '8px 0 0 0',
                                lineHeight: '1.4',
                                fontStyle: 'italic'
                              }}>
                                <strong>Special Notes:</strong> {exercise.special_instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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

            {isLoadingPatient ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #1e40af',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }} />
                <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading your profile...</p>
              </div>
            ) : !patientData ? (
              <div style={{
                textAlign: 'center',
                padding: '60px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Profile Not Found</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                  Unable to load patient profile. Please contact support.
                </p>
              </div>
            ) : (
              <>
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
                            {patientData.first_name} {patientData.last_name}
                          </h3>
                          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                            Patient ID: {patientData.id.slice(0, 8).toUpperCase()}
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
                          {patientData.email}
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
                          {patientData.phone || 'Not provided'}
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
                          {patientData.date_of_birth ? formatDate(patientData.date_of_birth) : 'Not provided'}
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
                          {patientData.date_of_birth ? `${calculateAge(patientData.date_of_birth)} years old` : 'Unknown'}
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
                          {patientData.doctors ? (
                            <>
                              <p style={{ color: '#1e40af', fontSize: '14px', fontWeight: '500', margin: '0' }}>
                                Dr. {patientData.doctors.first_name} {patientData.doctors.last_name}
                              </p>
                              <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>
                                {patientData.doctors.specialization || 'General Practice'}
                              </p>
                            </>
                          ) : (
                            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                              No doctor assigned
                            </p>
                          )}
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
                        {patientData.medical_conditions && patientData.medical_conditions.length > 0 ? (
                          patientData.medical_conditions.map((condition, index) => (
                            <span key={index} style={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: '1px solid #fecaca'
                            }}>
                              {condition}
                            </span>
                          ))
                        ) : (
                          <span style={{
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            No conditions recorded
                          </span>
                        )}
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
                        {patientData.current_medications && patientData.current_medications.length > 0 ? (
                          patientData.current_medications.map((medication, index) => (
                            <span key={index} style={{
                              backgroundColor: '#f0fdf4',
                              color: '#16a34a',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: '1px solid #bbf7d0'
                            }}>
                              {medication}
                            </span>
                          ))
                        ) : (
                          <span style={{
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            No medications recorded
                          </span>
                        )}
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
                      <p style={{ 
                        color: '#6b7280', 
                        fontSize: '14px', 
                        margin: '0',
                        padding: '8px 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        {patientData.emergency_contact_name || 'Not provided'}
                      </p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
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
                        {patientData.emergency_contact_phone || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* NFT Rewards Wallet */}
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

                    <div style={{ marginBottom: '16px' }}>
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
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        border: '1px solid #e2e8f0'
                      }}>
                        {formatWalletAddress(patientData.nft_wallet_address)}
                      </p>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      border: '1px solid #dbeafe'
                    }}>
                      <span style={{ fontSize: '20px', marginRight: '8px' }}>🏆</span>
                      <div>
                        <p style={{ color: '#1e40af', fontSize: '14px', fontWeight: '500', margin: '0' }}>
                          {nftCount} Achievement NFTs Earned
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>
                          Keep completing exercises to earn more rewards!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
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
