import { useState } from 'react';
import { supabase, Exercise } from '../lib/supabase';

interface AddCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseAdded: (exercise: Exercise) => void;
}

interface CustomExercise {
  name: string;
  description: string;
  category: string;
  difficulty_level: number;
  default_sets: number;
  default_reps: number | null;
  default_duration_seconds: number | null;
  rest_seconds: number;
  instructions: string;
  equipment_needed: string;
  muscle_groups: string[];
  safety_notes: string;
}

export default function AddCustomExerciseModal({ isOpen, onClose, onExerciseAdded }: AddCustomExerciseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseType, setExerciseType] = useState<'reps' | 'duration'>('reps');
  const [customExercise, setCustomExercise] = useState<CustomExercise>({
    name: '',
    description: '',
    category: 'core',
    difficulty_level: 1,
    default_sets: 1,
    default_reps: 10,
    default_duration_seconds: null,
    rest_seconds: 60,
    instructions: '',
    equipment_needed: '',
    muscle_groups: [],
    safety_notes: ''
  });

  const categories = [
    'core',
    'upper_body',
    'lower_body',
    'cardio',
    'flexibility',
    'balance',
    'strength',
    'rehabilitation'
  ];

  const commonMuscleGroups = [
    'Core',
    'Chest',
    'Back',
    'Shoulders',
    'Arms',
    'Legs',
    'Glutes',
    'Neck',
    'Full Body'
  ];

  const handleSubmit = async () => {
    try {
      if (!customExercise.name.trim() || !customExercise.instructions.trim()) {
        alert('Please fill in the exercise name and instructions');
        return;
      }

      setIsLoading(true);

      // Prepare exercise data based on type
      const exerciseData = {
        name: customExercise.name.trim(),
        description: customExercise.description.trim() || `Custom ${customExercise.category} exercise`,
        category: customExercise.category,
        difficulty_level: customExercise.difficulty_level,
        default_sets: customExercise.default_sets,
        default_reps: exerciseType === 'reps' ? customExercise.default_reps : null,
        default_duration_seconds: exerciseType === 'duration' ? customExercise.default_duration_seconds : null,
        rest_seconds: customExercise.rest_seconds,
        instructions: customExercise.instructions.trim(),
        equipment_needed: customExercise.equipment_needed.trim() || 'None',
        muscle_groups: customExercise.muscle_groups,
        safety_notes: customExercise.safety_notes.trim() || 'Follow proper form and listen to your body'
      };

      console.log('Creating custom exercise:', exerciseData);

      const { data: exercise, error } = await supabase
        .from('exercises')
        .insert(exerciseData)
        .select()
        .single();

      if (error) {
        console.error('Error creating custom exercise:', error);
        throw error;
      }

      console.log('Custom exercise created successfully:', exercise);
      onExerciseAdded(exercise);
      resetForm();
      onClose();
      alert('Custom exercise created successfully!');
    } catch (err) {
      console.error('Error creating custom exercise:', err);
      alert(`Failed to create custom exercise: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCustomExercise({
      name: '',
      description: '',
      category: 'core',
      difficulty_level: 1,
      default_sets: 1,
      default_reps: 10,
      default_duration_seconds: null,
      rest_seconds: 60,
      instructions: '',
      equipment_needed: '',
      muscle_groups: [],
      safety_notes: ''
    });
    setExerciseType('reps');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addMuscleGroup = (group: string) => {
    if (!customExercise.muscle_groups.includes(group)) {
      setCustomExercise(prev => ({
        ...prev,
        muscle_groups: [...prev.muscle_groups, group]
      }));
    }
  };

  const removeMuscleGroup = (group: string) => {
    setCustomExercise(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.filter(g => g !== group)
    }));
  };

  if (!isOpen) return null;

  return (
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
      zIndex: 1001,
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
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '12px 12px 0 0'
        }}>
          <h2 style={{
            color: '#1e40af',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💪</span>
            Create Custom Exercise
          </h2>
          <button
            onClick={handleClose}
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
          {/* Basic Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📝</span>
              Basic Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Exercise Name *
                </label>
                <input
                  type="text"
                  value={customExercise.name}
                  onChange={(e) => setCustomExercise(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Modified Push-ups"
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
              <div>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Category
                </label>
                <select
                  value={customExercise.category}
                  onChange={(e) => setCustomExercise(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
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
                value={customExercise.description}
                onChange={(e) => setCustomExercise(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this exercise targets and its benefits"
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
          </div>

          {/* Exercise Parameters */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚙️</span>
              Exercise Parameters
            </h3>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: '1' }}>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Exercise Type
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="exerciseType"
                      value="reps"
                      checked={exerciseType === 'reps'}
                      onChange={(e) => {
                        setExerciseType('reps');
                        setCustomExercise(prev => ({
                          ...prev,
                          default_reps: 10,
                          default_duration_seconds: null
                        }));
                      }}
                      style={{ marginRight: '4px' }}
                    />
                    <span style={{ color: '#374151', fontSize: '14px' }}>Repetition-based</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="exerciseType"
                      value="duration"
                      checked={exerciseType === 'duration'}
                      onChange={(e) => {
                        setExerciseType('duration');
                        setCustomExercise(prev => ({
                          ...prev,
                          default_reps: null,
                          default_duration_seconds: 30
                        }));
                      }}
                      style={{ marginRight: '4px' }}
                    />
                    <span style={{ color: '#374151', fontSize: '14px' }}>Time-based</span>
                  </label>
                </div>
              </div>
              <div style={{ flex: '1' }}>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Difficulty Level (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={customExercise.difficulty_level}
                  onChange={(e) => setCustomExercise(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) }))}
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Default Sets
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={customExercise.default_sets}
                  onChange={(e) => setCustomExercise(prev => ({ ...prev, default_sets: parseInt(e.target.value) }))}
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

              {exerciseType === 'reps' ? (
                <div>
                  <label style={{
                    display: 'block',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    Default Reps
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customExercise.default_reps || 10}
                    onChange={(e) => setCustomExercise(prev => ({ ...prev, default_reps: parseInt(e.target.value) }))}
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
              ) : (
                <div>
                  <label style={{
                    display: 'block',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={customExercise.default_duration_seconds || 30}
                    onChange={(e) => setCustomExercise(prev => ({ ...prev, default_duration_seconds: parseInt(e.target.value) }))}
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
              )}

              <div>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Rest (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={customExercise.rest_seconds}
                  onChange={(e) => setCustomExercise(prev => ({ ...prev, rest_seconds: parseInt(e.target.value) }))}
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
            </div>
          </div>

          {/* Muscle Groups */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🎯</span>
              Target Muscle Groups
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Click to add muscle groups:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {commonMuscleGroups.map(group => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => addMuscleGroup(group)}
                    disabled={customExercise.muscle_groups.includes(group)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '20px',
                      backgroundColor: customExercise.muscle_groups.includes(group) ? '#e5e7eb' : 'white',
                      color: customExercise.muscle_groups.includes(group) ? '#6b7280' : '#374151',
                      fontSize: '12px',
                      cursor: customExercise.muscle_groups.includes(group) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {customExercise.muscle_groups.length > 0 && (
              <div>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Selected muscle groups:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {customExercise.muscle_groups.map(group => (
                    <span
                      key={group}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '20px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {group}
                      <button
                        type="button"
                        onClick={() => removeMuscleGroup(group)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1e40af',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '0',
                          marginLeft: '4px'
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructions and Safety */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📋</span>
              Instructions & Safety
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Exercise Instructions *
              </label>
              <textarea
                value={customExercise.instructions}
                onChange={(e) => setCustomExercise(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Step-by-step instructions on how to perform this exercise correctly..."
                rows={4}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Equipment Needed
                </label>
                <input
                  type="text"
                  value={customExercise.equipment_needed}
                  onChange={(e) => setCustomExercise(prev => ({ ...prev, equipment_needed: e.target.value }))}
                  placeholder="e.g., Mat, Resistance band, Chair"
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
              <div>
                <label style={{
                  display: 'block',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Safety Notes
                </label>
                <input
                  type="text"
                  value={customExercise.safety_notes}
                  onChange={(e) => setCustomExercise(prev => ({ ...prev, safety_notes: e.target.value }))}
                  placeholder="e.g., Stop if you feel pain, keep knees aligned"
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
            </div>
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
              onClick={handleClose}
              disabled={isLoading}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !customExercise.name.trim() || !customExercise.instructions.trim()}
              style={{
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (isLoading || !customExercise.name.trim() || !customExercise.instructions.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || !customExercise.name.trim() || !customExercise.instructions.trim()) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating...
                </>
              ) : (
                <>
                  <span>💪</span>
                  Create Exercise
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
