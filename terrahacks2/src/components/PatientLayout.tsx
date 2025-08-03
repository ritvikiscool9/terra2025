import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase, NFT } from '../lib/supabase';
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
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [patientRoutines, setPatientRoutines] = useState<any[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [nftCount, setNftCount] = useState(0);
  const [patientNFTs, setPatientNFTs] = useState<NFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [editedMedicalCondition, setEditedMedicalCondition] = useState('');
  const [editedMedications, setEditedMedications] = useState<string[]>([]);
  const [isSavingMedical, setIsSavingMedical] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

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
      
      // Try to get the previously selected patient ID from localStorage
      const savedPatientId = localStorage.getItem('selectedPatientId');
      let selectedPatient = null;
      
      if (savedPatientId) {
        // Try to fetch the specific patient by ID
        const { data: specificPatient, error: specificError } = await supabase
          .from('patients')
          .select(`
            *,
            doctors(first_name, last_name, specialization)
          `)
          .eq('id', savedPatientId)
          .single();
          
        if (!specificError && specificPatient) {
          selectedPatient = specificPatient;
          console.log('✅ Loaded saved patient:', specificPatient.first_name, specificPatient.last_name);
        } else {
          console.log('⚠️ Saved patient not found, will select new one');
          localStorage.removeItem('selectedPatientId'); // Clean up invalid ID
        }
      }
      
      // If no saved patient or saved patient not found, get all patients for selection
      if (!selectedPatient) {
        const { data: patients, error } = await supabase
          .from('patients')
          .select(`
            *,
            doctors(first_name, last_name, specialization)
          `);

        if (error) throw error;
        
        if (patients && patients.length > 0) {
          // For demo: if no saved patient, use the first one and save it
          selectedPatient = patients[0];
          localStorage.setItem('selectedPatientId', selectedPatient.id);
          console.log('🔄 Selected new patient:', selectedPatient.first_name, selectedPatient.last_name);
          
          // TODO: In production, you'd show a patient selection UI here
          // For now, let's log all available patients for debugging
          console.log('Available patients:', patients.map(p => `${p.first_name} ${p.last_name} (${p.id})`));
        }
      }
      
      if (selectedPatient) {
        let patient = selectedPatient;
        
        // If no doctor is assigned, assign the first available doctor
        if (!patient.assigned_doctor_id) {
          const { data: doctors, error: doctorError } = await supabase
            .from('doctors')
            .select('id, first_name, last_name, specialization')
            .limit(1);
            
          if (!doctorError && doctors && doctors.length > 0) {
            const doctor = doctors[0];
            
            // Update patient with assigned doctor
            const { error: updateError } = await supabase
              .from('patients')
              .update({ assigned_doctor_id: doctor.id })
              .eq('id', patient.id);
              
            if (!updateError) {
              // Update patient object with doctor info
              patient.assigned_doctor_id = doctor.id;
              patient.doctors = {
                first_name: doctor.first_name,
                last_name: doctor.last_name,
                specialization: doctor.specialization
              };
            }
          }
        }
        
        setPatientData(patient);
        
        // Fetch NFTs for this patient
        await fetchPatientNFTs(patient.id);
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
      console.log('Fetching exercises for routine:', routineId);
      const { data: exercises, error } = await supabase
        .from('routine_exercises')
        .select(`
          *,
          exercises(name, description, instructions, category, difficulty_level)
        `)
        .eq('routine_id', routineId)
        .order('order_in_routine');

      if (error) {
        console.error('Error in fetchRoutineExercises:', error);
        throw error;
      }
      
      console.log('Fetched routine exercises:', exercises);
      setRoutineExercises(exercises || []);
    } catch (err) {
      console.error('Error fetching routine exercises:', err);
    }
  };

  const fetchPatientNFTs = async (patientId: string) => {
    try {
      setIsLoadingNFTs(true);
      console.log('Fetching NFTs for patient:', patientId);
      
      const { data: nfts, error } = await supabase
        .from('nfts')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching NFTs:', error);
        throw error;
      }

      console.log('Fetched NFTs:', nfts);
      setPatientNFTs(nfts || []);
      setNftCount(nfts?.length || 0);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setPatientNFTs([]);
      setNftCount(0);
    } finally {
      setIsLoadingNFTs(false);
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

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'Legendary': return '#fbbf24'; // Gold
      case 'Epic': return '#a855f7'; // Purple
      case 'Rare': return '#3b82f6'; // Blue
      case 'Uncommon': return '#10b981'; // Green
      case 'Common': return '#6b7280'; // Gray
      default: return '#6b7280';
    }
  };



  const handleEditProfile = () => {
    if (patientData) {
      setEditedEmail(patientData.email);
      setEditedPhone(patientData.phone || '');
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!patientData) return;

    // Basic validation
    if (!editedEmail.trim()) {
      alert('Email is required');
      return;
    }

    if (!editedEmail.includes('@') || !editedEmail.includes('.')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsSavingProfile(true);
      
      const { error } = await supabase
        .from('patients')
        .update({
          email: editedEmail.trim(),
          phone: editedPhone.trim()
        })
        .eq('id', patientData.id);

      if (error) throw error;

      // Update local state
      setPatientData({
        ...patientData,
        email: editedEmail.trim(),
        phone: editedPhone.trim()
      });

      setIsEditingProfile(false);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedEmail('');
    setEditedPhone('');
  };

  const handleEditMedical = () => {
    if (patientData) {
      // Set the first medical condition or empty string
      setEditedMedicalCondition(
        patientData.medical_conditions && patientData.medical_conditions.length > 0 
          ? patientData.medical_conditions[0] 
          : ''
      );
      // Set current medications or empty array
      setEditedMedications(patientData.current_medications || []);
      setIsEditingMedical(true);
    }
  };

  const handleSaveMedical = async () => {
    if (!patientData) return;

    try {
      setIsSavingMedical(true);
      
      // Prepare the data - only include condition if it's not empty
      const medicalConditions = editedMedicalCondition.trim() ? [editedMedicalCondition.trim()] : [];
      const medications = editedMedications.filter(med => med.trim() !== '').map(med => med.trim());

      const { error } = await supabase
        .from('patients')
        .update({
          medical_conditions: medicalConditions,
          current_medications: medications
        })
        .eq('id', patientData.id);

      if (error) throw error;

      // Update local state
      setPatientData({
        ...patientData,
        medical_conditions: medicalConditions,
        current_medications: medications
      });

      setIsEditingMedical(false);
      alert('Medical information updated successfully!');
    } catch (err) {
      console.error('Error updating medical info:', err);
      alert('Failed to update medical information. Please try again.');
    } finally {
      setIsSavingMedical(false);
    }
  };

  const handleCancelMedicalEdit = () => {
    setIsEditingMedical(false);
    setEditedMedicalCondition('');
    setEditedMedications([]);
  };

  const addMedication = () => {
    setEditedMedications([...editedMedications, '']);
  };

  const updateMedication = (index: number, value: string) => {
    const updated = [...editedMedications];
    updated[index] = value;
    setEditedMedications(updated);
  };

  const removeMedication = (index: number) => {
    const updated = editedMedications.filter((_, i) => i !== index);
    setEditedMedications(updated);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'workout':
        const exerciseContext = selectedExercise ? {
          name: selectedExercise.exercises?.name,
          description: selectedExercise.exercises?.description,
          instructions: selectedExercise.exercises?.instructions,
          category: selectedExercise.exercises?.category,
          difficulty_level: selectedExercise.exercises?.difficulty_level,
          sets: selectedExercise.sets,
          reps: selectedExercise.reps,
          duration_seconds: selectedExercise.duration_seconds
        } : undefined;
        
        return <VideoAnalyzer exerciseContext={exerciseContext} />;
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
                                {exercise.order_in_routine}. 
                                <button
                                  onClick={() => {
                                    setSelectedExercise(exercise);
                                    setCurrentPage('workout');
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#1e40af',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    padding: '0',
                                    margin: '0 0 0 4px',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#1d4ed8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#1e40af';
                                  }}
                                >
                                  {exercise.exercises?.name || 'Exercise'}
                                </button>
                              </h4>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                {exercise.exercises?.category || 'General'} • Level {exercise.exercises?.difficulty_level || 1}
                              </div>
                              {exercise.exercises?.description && (
                                <p style={{ 
                                  color: '#6b7280', 
                                  fontSize: '13px', 
                                  margin: '0 0 8px 0',
                                  lineHeight: '1.4',
                                  fontStyle: 'italic'
                                }}>
                                  {exercise.exercises.description}
                                </p>
                              )}
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
                              {/* Only show Sets if the exercise has more than 1 set OR if it has reps */}
                              {(exercise.sets > 1 || exercise.reps !== null) && (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Sets</div>
                                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>{exercise.sets}</div>
                                </div>
                              )}
                              
                              {/* Only show Reps if the exercise has reps (not null) */}
                              {exercise.reps && (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Reps</div>
                                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>{exercise.reps}</div>
                                </div>
                              )}
                              
                              {/* Only show Duration if the exercise has duration (not null) */}
                              {exercise.duration_seconds && (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Duration</div>
                                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>{exercise.duration_seconds}s</div>
                                </div>
                              )}
                              
                              {/* Only show Rest if the exercise has rest time > 0 */}
                              {exercise.rest_seconds > 0 && (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Rest</div>
                                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>{exercise.rest_seconds}s</div>
                                </div>
                              )}
                            </div>

                            {exercise.exercises?.instructions && (
                              <p style={{ 
                                color: '#374151', 
                                fontSize: '14px', 
                                margin: '0',
                                lineHeight: '1.4'
                              }}>
                                <strong>Instructions:</strong> {exercise.exercises.instructions}
                              </p>
                            )}

                            {exercise.notes && (
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
                        {isEditingProfile ? (
                          <input
                            type="email"
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '2px solid #dbeafe',
                              borderRadius: '6px',
                              fontSize: '14px',
                              color: '#374151',
                              backgroundColor: 'white',
                              outline: 'none',
                              transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                            onBlur={(e) => e.target.style.borderColor = '#dbeafe'}
                          />
                        ) : (
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: '14px', 
                            margin: '0',
                            padding: '8px 0',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            {patientData.email}
                          </p>
                        )}
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
                        {isEditingProfile ? (
                          <input
                            type="tel"
                            value={editedPhone}
                            onChange={(e) => setEditedPhone(e.target.value)}
                            placeholder="Enter phone number"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '2px solid #dbeafe',
                              borderRadius: '6px',
                              fontSize: '14px',
                              color: '#374151',
                              backgroundColor: 'white',
                              outline: 'none',
                              transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                            onBlur={(e) => e.target.style.borderColor = '#dbeafe'}
                          />
                        ) : (
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: '14px', 
                            margin: '0',
                            padding: '8px 0',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            {patientData.phone || 'Not provided'}
                          </p>
                        )}
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

                    {!isEditingProfile && (
                      <div style={{
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #dbeafe',
                        borderRadius: '6px',
                        padding: '12px',
                        marginTop: '16px'
                      }}>
                        <p style={{
                          color: '#1e40af',
                          fontSize: '12px',
                          margin: '0',
                          fontWeight: '500'
                        }}>
                          💡 You can edit your email and phone number. To change your name or date of birth, please contact support.
                        </p>
                      </div>
                    )}

                    {isEditingProfile ? (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          style={{
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                            opacity: isSavingProfile ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {isSavingProfile ? (
                            <>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid white',
                                borderTop: '2px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }} />
                              Saving...
                            </>
                          ) : (
                            <>✓ Save Changes</>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSavingProfile}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            border: '2px solid #d1d5db',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                            opacity: isSavingProfile ? 0.7 : 1
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleEditProfile}
                        style={{
                          backgroundColor: '#1e40af',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          marginTop: '20px'
                        }}
                      >
                        Edit Personal Info
                      </button>
                    )}
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
                        Primary Medical Condition
                      </label>
                      {isEditingMedical ? (
                        <input
                          type="text"
                          value={editedMedicalCondition}
                          onChange={(e) => setEditedMedicalCondition(e.target.value)}
                          placeholder="Enter primary medical condition (optional)"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #dbeafe',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#374151',
                            backgroundColor: 'white',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                          onBlur={(e) => e.target.style.borderColor = '#dbeafe'}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {patientData.medical_conditions && patientData.medical_conditions.length > 0 ? (
                            <span style={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: '1px solid #fecaca'
                            }}>
                              {patientData.medical_conditions[0]}
                            </span>
                          ) : (
                            <span style={{
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              No condition recorded
                            </span>
                          )}
                        </div>
                      )}
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
                      {isEditingMedical ? (
                        <div>
                          {editedMedications.map((medication, index) => (
                            <div key={index} style={{ 
                              display: 'flex', 
                              gap: '8px', 
                              marginBottom: '8px',
                              alignItems: 'center'
                            }}>
                              <input
                                type="text"
                                value={medication}
                                onChange={(e) => updateMedication(index, e.target.value)}
                                placeholder="Enter medication name and dosage"
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  border: '2px solid #dbeafe',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  color: '#374151',
                                  backgroundColor: 'white',
                                  outline: 'none',
                                  transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                                onBlur={(e) => e.target.style.borderColor = '#dbeafe'}
                              />
                              <button
                                onClick={() => removeMedication(index)}
                                style={{
                                  backgroundColor: '#dc2626',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 10px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  minWidth: '24px'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={addMedication}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#16a34a',
                              border: '2px dashed #16a34a',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              width: '100%',
                              marginTop: '8px'
                            }}
                          >
                            + Add Medication
                          </button>
                        </div>
                      ) : (
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
                      )}
                    </div>

                    {isEditingMedical ? (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button
                          onClick={handleSaveMedical}
                          disabled={isSavingMedical}
                          style={{
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isSavingMedical ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: isSavingMedical ? 0.7 : 1
                          }}
                        >
                          {isSavingMedical && (
                            <div className="spinner" style={{
                              width: '14px',
                              height: '14px',
                              border: '2px solid transparent',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                          )}
                          {isSavingMedical ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelMedicalEdit}
                          disabled={isSavingMedical}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            border: '2px solid #d1d5db',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isSavingMedical ? 'not-allowed' : 'pointer',
                            opacity: isSavingMedical ? 0.5 : 1
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleEditMedical}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#1e40af',
                          border: '2px solid #1e40af',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          marginTop: '8px'
                        }}
                      >
                        Update Medical Info
                      </button>
                    )}
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

                {/* NFT Collection Gallery */}
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
                    paddingBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>🎨</span>
                    My NFT Collection
                  </h2>

                  {isLoadingNFTs ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e2e8f0',
                        borderTop: '4px solid #1e40af',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                      }} />
                      <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>Loading your NFT collection...</p>
                    </div>
                  ) : patientNFTs.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '20px'
                    }}>
                      {patientNFTs.map((nft) => (
                        <div
                          key={nft.id}
                          onClick={() => setSelectedNFT(nft)}
                          style={{
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.borderColor = '#1e40af';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div style={{
                            width: '100%',
                            height: '200px',
                            backgroundImage: `url(${nft.image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: getRarityColor(nft.rarity),
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: '600',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}>
                              {nft.rarity}
                            </div>
                            {nft.completion_score && (
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {nft.completion_score}%
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '16px' }}>
                            <h4 style={{
                              color: '#374151',
                              fontSize: '16px',
                              fontWeight: '600',
                              margin: '0 0 8px 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {nft.name}
                            </h4>
                            <p style={{
                              color: '#6b7280',
                              fontSize: '13px',
                              margin: '0 0 12px 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {nft.exercise_type} • {nft.difficulty_level}
                            </p>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span style={{
                                color: '#10b981',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: '#d1fae5',
                                padding: '2px 6px',
                                borderRadius: '8px'
                              }}>
                                Minted
                              </span>
                              <span style={{
                                color: '#6b7280',
                                fontSize: '11px'
                              }}>
                                {new Date(nft.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '60px 20px',
                      color: '#6b7280'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                      <h3 style={{ 
                        color: '#374151', 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        margin: '0 0 8px 0' 
                      }}>
                        No NFTs Yet
                      </h3>
                      <p style={{ 
                        fontSize: '14px', 
                        margin: '0 0 20px 0',
                        maxWidth: '400px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}>
                        Complete your exercises with good form to earn achievement NFTs! 
                        Each NFT represents your dedication to rehabilitation and fitness.
                      </p>
                      <button 
                        onClick={() => setCurrentPage('workout')}
                        style={{
                          backgroundColor: '#1e40af',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#1d4ed8'}
                        onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#1e40af'}
                      >
                        Start Workout
                      </button>
                    </div>
                  )}
                </div>

                {/* NFT Details Modal */}
                {selectedNFT && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                  }}
                  onClick={() => setSelectedNFT(null)}
                  >
                    <div 
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => setSelectedNFT(null)}
                        style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          fontSize: '24px',
                          cursor: 'pointer',
                          color: '#6b7280',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1001
                        }}
                        onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                      >
                        ×
                      </button>

                      <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                          {/* NFT Image */}
                          <div style={{ flex: '0 0 200px' }}>
                            <div style={{
                              width: '200px',
                              height: '200px',
                              backgroundImage: `url(${selectedNFT.image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: '16px',
                              position: 'relative',
                              border: '3px solid #e2e8f0'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                backgroundColor: getRarityColor(selectedNFT.rarity),
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {selectedNFT.rarity}
                              </div>
                            </div>
                          </div>

                          {/* NFT Details */}
                          <div style={{ flex: 1 }}>
                            <h2 style={{
                              color: '#374151',
                              fontSize: '24px',
                              fontWeight: '700',
                              margin: '0 0 12px 0'
                            }}>
                              {selectedNFT.name}
                            </h2>

                            <p style={{
                              color: '#6b7280',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              margin: '0 0 20px 0'
                            }}>
                              {selectedNFT.description}
                            </p>

                            {/* Key Stats */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '12px',
                              marginBottom: '20px'
                            }}>
                              <div style={{
                                padding: '12px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}>
                                <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>Exercise Type</div>
                                <div style={{ color: '#374151', fontSize: '14px', fontWeight: '600' }}>{selectedNFT.exercise_type}</div>
                              </div>
                              {selectedNFT.completion_score && (
                                <div style={{
                                  padding: '12px',
                                  backgroundColor: '#f0f9ff',
                                  borderRadius: '8px',
                                  border: '1px solid #dbeafe'
                                }}>
                                  <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>Score</div>
                                  <div style={{ color: '#1e40af', fontSize: '14px', fontWeight: '600' }}>{selectedNFT.completion_score}%</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Blockchain Info */}
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <h3 style={{
                            color: '#374151',
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: '0 0 12px 0'
                          }}>
                            Blockchain Details
                          </h3>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {selectedNFT.transaction_hash && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280', fontSize: '13px' }}>Transaction:</span>
                                <a 
                                  href={`https://amoy.polygonscan.com/tx/${selectedNFT.transaction_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    color: '#1e40af', 
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    textDecoration: 'none'
                                  }}
                                >
                                  {`${selectedNFT.transaction_hash.slice(0, 8)}...${selectedNFT.transaction_hash.slice(-8)}`}
                                </a>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontSize: '13px' }}>Contract:</span>
                              <span style={{ 
                                color: '#374151', 
                                fontSize: '13px',
                                fontFamily: 'monospace'
                              }}>
                                {`${selectedNFT.contract_address.slice(0, 8)}...${selectedNFT.contract_address.slice(-8)}`}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontSize: '13px' }}>Minted:</span>
                              <span style={{ color: '#374151', fontSize: '13px' }}>
                                {new Date(selectedNFT.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
