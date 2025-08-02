-- Supabase Schema for Rehabilitation App
-- Run these SQL commands in your Supabase SQL editor

-- Enable Row Level Security
-- ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DOCTORS TABLE
-- =====================================================
CREATE TABLE doctors (
    id VARCHAR(10) PRIMARY KEY, -- Changed to allow simple IDs like "001"
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    medical_license VARCHAR(50),
    specialization VARCHAR(100),
    hospital_affiliation VARCHAR(200),
    phone VARCHAR(20),
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT[],
    current_medications TEXT[],
    wallet_address VARCHAR(42), -- Ethereum wallet address for NFTs
    profile_image_url TEXT,
    assigned_doctor_id VARCHAR(10) REFERENCES doctors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EXERCISE_TEMPLATES TABLE
-- =====================================================
CREATE TABLE exercise_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., 'strength', 'cardio', 'flexibility', 'rehabilitation'
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    target_body_parts TEXT[], -- e.g., ['shoulders', 'core', 'legs']
    instructions TEXT NOT NULL,
    precautions TEXT,
    demo_video_url TEXT,
    created_by_doctor_id VARCHAR(10) REFERENCES doctors(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROUTINES TABLE
-- =====================================================
CREATE TABLE routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    prescribed_by_doctor_id VARCHAR(10) REFERENCES doctors(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    frequency_per_week INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    notes TEXT, -- Doctor's notes about the routine
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROUTINE_EXERCISES TABLE (Junction table)
-- =====================================================
CREATE TABLE routine_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
    exercise_template_id UUID REFERENCES exercise_templates(id) ON DELETE CASCADE,
    sets INTEGER DEFAULT 1,
    reps INTEGER,
    duration_seconds INTEGER, -- for time-based exercises
    rest_seconds INTEGER DEFAULT 60,
    target_weight DECIMAL(6,2), -- in kg
    order_in_routine INTEGER NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique ordering within a routine
    UNIQUE(routine_id, order_in_routine)
);

-- =====================================================
-- EXERCISE_COMPLETIONS TABLE
-- =====================================================
CREATE TABLE exercise_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_exercise_id UUID REFERENCES routine_exercises(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    video_url TEXT, -- URL to uploaded video
    ai_analysis_result JSONB, -- Store the full Gemini AI analysis
    form_score INTEGER CHECK (form_score >= 0 AND form_score <= 100),
    completion_status VARCHAR(20) CHECK (completion_status IN ('completed', 'needs_improvement', 'failed')),
    actual_sets INTEGER,
    actual_reps INTEGER,
    actual_duration_seconds INTEGER,
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    doctor_feedback TEXT,
    nft_minted BOOLEAN DEFAULT false,
    nft_token_id VARCHAR(100), -- Will be populated when NFT is minted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_email ON doctors(email);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_assigned_doctor ON patients(assigned_doctor_id);
CREATE INDEX idx_patients_wallet_address ON patients(wallet_address);

CREATE INDEX idx_exercise_templates_category ON exercise_templates(category);
CREATE INDEX idx_exercise_templates_difficulty ON exercise_templates(difficulty_level);
CREATE INDEX idx_exercise_templates_created_by ON exercise_templates(created_by_doctor_id);

CREATE INDEX idx_routines_patient_id ON routines(patient_id);
CREATE INDEX idx_routines_doctor_id ON routines(prescribed_by_doctor_id);
CREATE INDEX idx_routines_active ON routines(is_active);
CREATE INDEX idx_routines_date_range ON routines(start_date, end_date);

CREATE INDEX idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX idx_routine_exercises_template_id ON routine_exercises(exercise_template_id);

CREATE INDEX idx_exercise_completions_patient_id ON exercise_completions(patient_id);
CREATE INDEX idx_exercise_completions_routine_exercise_id ON exercise_completions(routine_exercise_id);
CREATE INDEX idx_exercise_completions_date ON exercise_completions(completion_date);
CREATE INDEX idx_exercise_completions_nft_status ON exercise_completions(nft_minted);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Doctors can only see their own data and their patients
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view own profile" ON doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can update own profile" ON doctors FOR UPDATE USING (auth.uid() = user_id);

-- Patients can only see their own data
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own profile" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can update own profile" ON patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view their patients" ON patients FOR SELECT USING (
    assigned_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors can update their patients" ON patients FOR UPDATE USING (
    assigned_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Exercise templates - public read, doctors can create
ALTER TABLE exercise_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public exercise templates" ON exercise_templates FOR SELECT USING (is_public = true);
CREATE POLICY "Doctors can create exercise templates" ON exercise_templates FOR INSERT WITH CHECK (
    created_by_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors can update their own exercise templates" ON exercise_templates FOR UPDATE USING (
    created_by_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Routines - patients can see their own, doctors can see their prescribed routines
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view their own routines" ON routines FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors can view routines they prescribed" ON routines FOR SELECT USING (
    prescribed_by_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors can create routines for their patients" ON routines FOR INSERT WITH CHECK (
    prescribed_by_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) AND
    patient_id IN (SELECT id FROM patients WHERE assigned_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
);
CREATE POLICY "Doctors can update routines they prescribed" ON routines FOR UPDATE USING (
    prescribed_by_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Routine exercises - inherit permissions from routines
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view routine exercises if they can view the routine" ON routine_exercises FOR SELECT USING (
    routine_id IN (
        SELECT r.id FROM routines r 
        WHERE r.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        OR r.prescribed_by_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
);

-- Exercise completions - patients can create/view their own, doctors can view their patients'
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view their own completions" ON exercise_completions FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Patients can create their own completions" ON exercise_completions FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors can view their patients' completions" ON exercise_completions FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE assigned_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
);
CREATE POLICY "Doctors can update completions with feedback" ON exercise_completions FOR UPDATE USING (
    patient_id IN (SELECT id FROM patients WHERE assigned_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_exercise_templates_updated_at BEFORE UPDATE ON exercise_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON routines FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample exercise templates
INSERT INTO exercise_templates (name, description, category, difficulty_level, target_body_parts, instructions, precautions) VALUES
('Push-ups', 'Basic push-up exercise for upper body strength', 'strength', 2, ARRAY['chest', 'shoulders', 'triceps'], 'Start in plank position, lower body until chest nearly touches floor, push back up', 'Avoid if you have wrist injuries'),
('Squats', 'Bodyweight squats for lower body strength', 'strength', 2, ARRAY['legs', 'glutes'], 'Stand with feet shoulder-width apart, lower down as if sitting in chair, return to standing', 'Keep knees aligned with toes'),
('Plank', 'Core strengthening isometric exercise', 'strength', 3, ARRAY['core', 'shoulders'], 'Hold plank position maintaining straight line from head to heels', 'Avoid if you have lower back issues'),
('Wall Sits', 'Isometric leg strengthening exercise', 'strength', 2, ARRAY['legs', 'glutes'], 'Lean back against wall, slide down until thighs parallel to floor, hold position', 'Stop if you feel knee pain'),
('Arm Circles', 'Shoulder mobility and warm-up exercise', 'flexibility', 1, ARRAY['shoulders'], 'Extend arms to sides, make small circles gradually increasing size', 'Start with small movements');

-- Note: You'll need to insert actual user data after setting up authentication
-- and link doctors/patients to their respective auth.users entries
