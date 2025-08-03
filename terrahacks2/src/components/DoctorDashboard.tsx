import { useState, useEffect } from 'react';
import { supabase, Patient, ExerciseCompletion, Exercise, NFT } from '../lib/supabase';

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
  const [patientNFTs, setPatientNFTs] = useState<NFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);
  const [selectedPatientForRoutine, setSelectedPatientForRoutine] = useState<PatientWithStats | null>(null);
  const [newRoutine, setNewRoutine] = useState({
    title: '',
    description: '',
    patientId: '',
    exercises: [] as any[]
  });

  useEffect(() => {
    fetchPatients();
    fetchAvailableExercises();
  }, []);

  const fetchAvailableExercises = async () => {
    try {
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableExercises(exercises || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
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
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setPatientNFTs([]);
    } finally {
      setIsLoadingNFTs(false);
    }
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

  const generatePersonalizedExercises = async (patient: PatientWithStats) => {
    try {
      setIsGeneratingExercises(true);
      setAvailableExercises([]); // Clear current exercises while loading

      console.log('Generating personalized exercises for patient:', patient);

      if (!patient.medical_conditions || patient.medical_conditions.length === 0) {
        // Fallback to default exercises if no medical conditions
        await fetchAvailableExercises();
        return;
      }

      const response = await fetch('/api/generate-exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientConditions: patient.medical_conditions,
          patientName: `${patient.first_name} ${patient.last_name}`
        })
      });

      const data = await response.json();

      if (response.ok && data.exercises) {
        console.log('Generated exercises:', data.exercises);
        setAvailableExercises(data.exercises);
      } else {
        console.error('Error generating exercises:', data.error);
        // Fallback to default exercises
        await fetchAvailableExercises();
        alert('Could not generate personalized exercises. Using default exercises instead.');
      }
    } catch (error) {
      console.error('Error generating personalized exercises:', error);
      // Fallback to default exercises
      await fetchAvailableExercises();
      alert('Could not generate personalized exercises. Using default exercises instead.');
    } finally {
      setIsGeneratingExercises(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('Fetching patients from Supabase...');
      
      // Get patients for the logged-in doctor
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { patientsData, patientsError });

      if (patientsError) throw patientsError;

      // Fetch exercise completion stats for each patient
      const patientsWithStats = await Promise.all(
        (patientsData || []).map(async (patient: Patient) => {
          console.log('Processing patient:', patient);
          const { data: completions } = await supabase
            .from('exercise_completions')
            .select('*')
            .eq('patient_id', patient.id);

          console.log(`Completions for patient ${patient.id}:`, completions);

          const totalExercises = completions?.length || 0;
          const completedExercises = completions?.filter((c: ExerciseCompletion) => c.completion_status === 'completed').length || 0;
          const nftCount = completions?.filter((c: ExerciseCompletion) => c.nft_minted).length || 0;
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
      const { data: completions, error } = await supabase
        .from('exercise_completions')
        .select('*')
        .eq('patient_id', patient.id)
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setPatientCompletions(completions || []);

      // Fetch NFTs for this patient
      await fetchPatientNFTs(patient.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient details');
    }
  };

  const addExerciseToRoutine = (exercise: Exercise) => {
    const routineExercise = {
      exercise_template_id: exercise.id,
      exercise_name: exercise.name,
      sets: exercise.default_sets || 1,
      reps: exercise.default_reps || null,
      duration_seconds: exercise.default_duration_seconds || null,
      rest_seconds: exercise.rest_seconds || 60,
      order_in_routine: newRoutine.exercises.length + 1,
      special_instructions: ''
    };
    
    setNewRoutine(prev => ({
      ...prev,
      exercises: [...prev.exercises, routineExercise]
    }));
  };

  const removeExerciseFromRoutine = (index: number) => {
    setNewRoutine(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index).map((ex, i) => ({
        ...ex,
        order_in_routine: i + 1
      }))
    }));
  };

  const updateRoutineExercise = (index: number, field: string, value: any) => {
    setNewRoutine(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const createRoutine = async () => {
    try {
      if (!newRoutine.title || !newRoutine.patientId || newRoutine.exercises.length === 0) {
        alert('Please fill in all required fields and add at least one exercise');
        return;
      }

      console.log('Creating routine with data:', newRoutine);

      // First, get the doctor ID for the current session (using first doctor for demo)
      const { data: doctors, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .limit(1);

      if (doctorError || !doctors || doctors.length === 0) {
        console.error('No doctor found:', doctorError);
        alert('Doctor information not found. Please ensure you are logged in as a doctor.');
        return;
      }

      const doctorId = doctors[0].id;
      console.log('Using doctor ID:', doctorId);

      // First, save any AI-generated exercises to the exercises table
      const exercisesToSave = [];
      const exerciseIdMapping = new Map();

      for (const ex of newRoutine.exercises) {
        if (ex.exercise_template_id.startsWith('ai-generated-')) {
          // This is an AI-generated exercise, save it to the database first
          const exerciseData = {
            name: ex.exercise_name,
            description: availableExercises.find(e => e.id === ex.exercise_template_id)?.description || 'AI-generated rehabilitation exercise',
            category: availableExercises.find(e => e.id === ex.exercise_template_id)?.category || 'core',
            difficulty_level: availableExercises.find(e => e.id === ex.exercise_template_id)?.difficulty_level || 1,
            default_sets: ex.sets,
            default_reps: ex.reps,
            default_duration_seconds: ex.duration_seconds,
            instructions: availableExercises.find(e => e.id === ex.exercise_template_id)?.instructions || 'Follow your physical therapist\'s guidance for proper form.'
          };

          const { data: savedExercise, error: exerciseError } = await supabase
            .from('exercises')
            .insert(exerciseData)
            .select()
            .single();

          if (exerciseError) {
            console.error('Error saving exercise:', exerciseError);
            throw exerciseError;
          }

          exerciseIdMapping.set(ex.exercise_template_id, savedExercise.id);
          console.log(`Saved AI exercise: ${ex.exercise_name} with ID: ${savedExercise.id}`);
        } else {
          // Use existing exercise ID
          exerciseIdMapping.set(ex.exercise_template_id, ex.exercise_template_id);
        }
      }

      // Create the routine
      const routineData = {
        patient_id: newRoutine.patientId,
        prescribed_by_doctor_id: doctorId,
        title: newRoutine.title,
        description: newRoutine.description,
        start_date: new Date().toISOString().split('T')[0],
        frequency_per_week: 3,
        is_active: true
      };

      console.log('Creating routine with data:', routineData);

      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .insert(routineData)
        .select()
        .single();

      if (routineError) {
        console.error('Error creating routine:', routineError);
        throw routineError;
      }

      console.log('Routine created successfully:', routine);

      // Add exercises to the routine
      const routineExercises = newRoutine.exercises.map(ex => ({
        routine_id: routine.id,
        exercise_id: exerciseIdMapping.get(ex.exercise_template_id),
        sets: ex.sets,
        reps: ex.reps,
        duration_seconds: ex.duration_seconds,
        rest_seconds: ex.rest_seconds,
        order_in_routine: ex.order_in_routine,
        notes: ex.special_instructions
      }));

      console.log('Adding routine exercises:', routineExercises);

      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(routineExercises);

      if (exercisesError) {
        console.error('Error adding exercises to routine:', exercisesError);
        throw exercisesError;
      }

      console.log('Routine exercises added successfully');

      alert('Routine created successfully!');
      setShowCreateRoutine(false);
      setSelectedPatientForRoutine(null);
      setAvailableExercises([]);
      setNewRoutine({
        title: '',
        description: '',
        patientId: '',
        exercises: []
      });

      // Refresh the patients list to show updated data
      await fetchPatients();
    } catch (err) {
      console.error('Error creating routine:', err);
      alert(`Failed to create routine: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
          <button
            onClick={() => setShowCreateRoutine(true)}
            style={{
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
          >
            <span>📋</span>
            Create Routine
          </button>
        </div>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px', 
          margin: '0',
          lineHeight: '1.5'
        }}>
          Monitor your patients' progress and create personalized workout routines.
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
                  {selectedPatient.nft_wallet_address && (
                    <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
                      <strong>Wallet:</strong> {selectedPatient.nft_wallet_address.slice(0, 6)}...{selectedPatient.nft_wallet_address.slice(-4)}
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

                {/* Patient NFT Collection */}
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{
                    color: '#374151',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>🎨</span>
                    Patient NFT Collection ({patientNFTs.length})
                  </h3>

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
                      <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>Loading NFT collection...</p>
                    </div>
                  ) : patientNFTs.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '16px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      padding: '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb'
                    }}>
                      {patientNFTs.map((nft) => (
                        <div
                          key={nft.id}
                          onClick={() => setSelectedNFT(nft)}
                          style={{
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            backgroundColor: 'white',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div style={{
                            width: '100%',
                            height: '160px',
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
                              fontSize: '10px',
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
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                {nft.completion_score}%
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '12px' }}>
                            <h4 style={{
                              color: '#374151',
                              fontSize: '13px',
                              fontWeight: '600',
                              margin: '0 0 4px 0',
                              lineHeight: '1.2'
                            }}>
                              {nft.name}
                            </h4>
                            <p style={{
                              color: '#6b7280',
                              fontSize: '11px',
                              margin: '0',
                              lineHeight: '1.3'
                            }}>
                              {nft.exercise_type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
                      <h4 style={{ color: '#6b7280', marginBottom: '8px' }}>No NFTs Earned Yet</h4>
                      <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0' }}>
                        Patient will earn NFTs when completing exercises with good form.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Routine Modal */}
      {showCreateRoutine && (
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
            maxWidth: '800px',
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
                Create New Routine
              </h2>
              <button
                onClick={() => {
                  setShowCreateRoutine(false);
                  setSelectedPatientForRoutine(null);
                  setAvailableExercises([]);
                  setNewRoutine({
                    title: '',
                    description: '',
                    patientId: '',
                    exercises: []
                  });
                }}
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
              {/* Routine Basic Info */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    Routine Title *
                  </label>
                  <input
                    type="text"
                    value={newRoutine.title}
                    onChange={(e) => setNewRoutine(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Upper Body Strength Training"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={newRoutine.description}
                    onChange={(e) => setNewRoutine(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the routine goals and focus areas"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    Assign to Patient *
                  </label>
                  <select
                    value={newRoutine.patientId}
                    onChange={async (e) => {
                      const patientId = e.target.value;
                      setNewRoutine(prev => ({ ...prev, patientId, exercises: [] })); // Clear exercises when patient changes
                      
                      if (patientId) {
                        const selectedPatient = patients.find(p => p.id === patientId);
                        if (selectedPatient) {
                          setSelectedPatientForRoutine(selectedPatient);
                          await generatePersonalizedExercises(selectedPatient);
                        }
                      } else {
                        setSelectedPatientForRoutine(null);
                        setAvailableExercises([]);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exercise Selection */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  color: '#374151',
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  {selectedPatientForRoutine ? (
                    <>
                      Personalized Exercises for {selectedPatientForRoutine.first_name} {selectedPatientForRoutine.last_name}
                      {selectedPatientForRoutine.medical_conditions && selectedPatientForRoutine.medical_conditions.length > 0 && (
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#6b7280', 
                          fontWeight: '400',
                          marginTop: '4px'
                        }}>
                          Medical Conditions: {selectedPatientForRoutine.medical_conditions.join(', ')}
                        </div>
                      )}
                    </>
                  ) : (
                    'Available Exercises'
                  )}
                </h3>
                
                {isGeneratingExercises ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #1e40af',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '12px'
                    }} />
                    <span style={{ color: '#6b7280' }}>
                      Generating personalized exercises using AI...
                    </span>
                  </div>
                ) : newRoutine.patientId && availableExercises.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280'
                  }}>
                    Please select a patient to generate personalized exercises
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '12px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    {availableExercises.map(exercise => (
                      <div
                        key={exercise.id}
                        onClick={() => addExerciseToRoutine(exercise)}
                        style={{
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: '#f9fafb',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      >
                        <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                          {exercise.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          {exercise.category} • Level {exercise.difficulty_level}
                        </div>
                        {exercise.description && (
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {exercise.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Exercises */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  color: '#374151',
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Routine Exercises ({newRoutine.exercises.length})
                </h3>
                {newRoutine.exercises.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    color: '#6b7280'
                  }}>
                    No exercises added yet. Click on exercises above to add them.
                  </div>
                ) : (
                  <div>
                    {newRoutine.exercises.map((exercise, index) => (
                      <div
                        key={index}
                        style={{
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '16px',
                          marginBottom: '12px',
                          backgroundColor: '#f9fafb'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <h4 style={{
                            color: '#1e40af',
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: '0'
                          }}>
                            {exercise.order_in_routine}. {exercise.exercise_name}
                          </h4>
                          <button
                            onClick={() => removeExerciseFromRoutine(index)}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: '12px'
                        }}>
                          {/* Only show Sets if the exercise has more than 1 set OR if it has reps */}
                          {(exercise.sets > 1 || exercise.reps !== null) && (
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                                Sets
                              </label>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateRoutineExercise(index, 'sets', parseInt(e.target.value) || 1)}
                                min="1"
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Only show Reps if the exercise has reps (not null) */}
                          {exercise.reps !== null && (
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                                Reps
                              </label>
                              <input
                                type="number"
                                value={exercise.reps || ''}
                                onChange={(e) => updateRoutineExercise(index, 'reps', parseInt(e.target.value) || null)}
                                min="1"
                                placeholder="10"
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Only show Duration if the exercise has duration (not null) */}
                          {exercise.duration_seconds !== null && (
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                                Duration (sec)
                              </label>
                              <input
                                type="number"
                                value={exercise.duration_seconds || ''}
                                onChange={(e) => updateRoutineExercise(index, 'duration_seconds', parseInt(e.target.value) || null)}
                                min="1"
                                placeholder="30"
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Only show Rest if the exercise has rest time > 0 */}
                          {exercise.rest_seconds > 0 && (
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                                Rest (sec)
                              </label>
                              <input
                                type="number"
                                value={exercise.rest_seconds}
                                onChange={(e) => updateRoutineExercise(index, 'rest_seconds', parseInt(e.target.value) || 0)}
                                min="0"
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => {
                    setShowCreateRoutine(false);
                    setSelectedPatientForRoutine(null);
                    setAvailableExercises([]);
                    setNewRoutine({
                      title: '',
                      description: '',
                      patientId: '',
                      exercises: []
                    });
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createRoutine}
                  style={{
                    backgroundColor: '#1e40af',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Create Routine
                </button>
              </div>
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
