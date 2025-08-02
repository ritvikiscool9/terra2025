-- Enable Row Level Security
alter table if exists public.doctors enable row level security;
alter table if exists public.patients enable row level security;
alter table if exists public.routines enable row level security;
alter table if exists public.exercises enable row level security;
alter table if exists public.routine_exercises enable row level security;
alter table if exists public.exercise_completions enable row level security;

-- Create doctors table
create table if not exists public.doctors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  email varchar(255) not null unique,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  medical_license varchar(100),
  specialization varchar(200),
  hospital_affiliation varchar(300),
  phone varchar(20),
  profile_image_url text,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create patients table (with NFT wallet address)
create table if not exists public.patients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  email varchar(255) not null unique,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  date_of_birth date,
  phone varchar(20),
  emergency_contact_name varchar(200),
  emergency_contact_phone varchar(20),
  medical_conditions text[],
  current_medications text[],
  nft_wallet_address varchar(42), -- Ethereum wallet address (42 characters)
  profile_image_url text,
  assigned_doctor_id uuid references public.doctors(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create exercises table (exercise library)
create table if not exists public.exercises (
  id uuid default gen_random_uuid() primary key,
  name varchar(200) not null,
  description text,
  category varchar(100), -- e.g., 'upper_body', 'lower_body', 'core', 'cardio'
  difficulty_level integer check (difficulty_level >= 1 and difficulty_level <= 5),
  default_sets integer,
  default_reps integer,
  default_duration_seconds integer,
  instructions text,
  video_demo_url text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create routines table
create table if not exists public.routines (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  prescribed_by_doctor_id uuid references public.doctors(id) on delete cascade not null,
  title varchar(300) not null,
  description text,
  start_date date not null,
  end_date date,
  frequency_per_week integer not null check (frequency_per_week >= 1 and frequency_per_week <= 7),
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create routine_exercises table (junction table for routines and exercises)
create table if not exists public.routine_exercises (
  id uuid default gen_random_uuid() primary key,
  routine_id uuid references public.routines(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  sets integer not null,
  reps integer,
  duration_seconds integer,
  rest_seconds integer,
  order_in_routine integer not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create exercise_completions table
create table if not exists public.exercise_completions (
  id uuid default gen_random_uuid() primary key,
  routine_exercise_id uuid references public.routine_exercises(id) on delete cascade not null,
  patient_id uuid references public.patients(id) on delete cascade not null,
  video_url text,
  ai_analysis_result jsonb,
  form_score integer check (form_score >= 0 and form_score <= 100),
  completion_status varchar(20) check (completion_status in ('completed', 'needs_improvement', 'failed')) not null,
  actual_sets integer,
  actual_reps integer,
  actual_duration_seconds integer,
  completion_date timestamp with time zone default timezone('utc'::text, now()) not null,
  doctor_feedback text,
  nft_minted boolean default false,
  nft_token_id varchar(100),
  nft_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_doctors_user_id on public.doctors(user_id);
create index if not exists idx_doctors_email on public.doctors(email);
create index if not exists idx_patients_user_id on public.patients(user_id);
create index if not exists idx_patients_email on public.patients(email);
create index if not exists idx_patients_assigned_doctor on public.patients(assigned_doctor_id);
create index if not exists idx_routines_patient_id on public.routines(patient_id);
create index if not exists idx_routines_doctor_id on public.routines(prescribed_by_doctor_id);
create index if not exists idx_routine_exercises_routine_id on public.routine_exercises(routine_id);
create index if not exists idx_exercise_completions_patient_id on public.exercise_completions(patient_id);
create index if not exists idx_exercise_completions_routine_exercise_id on public.exercise_completions(routine_exercise_id);

-- Row Level Security Policies

-- Doctors can only see their own data
create policy "Doctors can view own profile" on public.doctors
  for select using (auth.uid() = user_id);

create policy "Doctors can update own profile" on public.doctors
  for update using (auth.uid() = user_id);

create policy "Doctors can insert own profile" on public.doctors
  for insert with check (auth.uid() = user_id);

-- Patients can only see their own data
create policy "Patients can view own profile" on public.patients
  for select using (auth.uid() = user_id);

create policy "Patients can update own profile" on public.patients
  for update using (auth.uid() = user_id);

create policy "Patients can insert own profile" on public.patients
  for insert with check (auth.uid() = user_id);

-- Doctors can see their assigned patients
create policy "Doctors can view assigned patients" on public.patients
  for select using (
    assigned_doctor_id in (
      select id from public.doctors where user_id = auth.uid()
    )
  );

-- Routines visibility
create policy "Patients can view their routines" on public.routines
  for select using (
    patient_id in (
      select id from public.patients where user_id = auth.uid()
    )
  );

create policy "Doctors can view routines they prescribed" on public.routines
  for select using (
    prescribed_by_doctor_id in (
      select id from public.doctors where user_id = auth.uid()
    )
  );

create policy "Doctors can insert routines for their patients" on public.routines
  for insert with check (
    prescribed_by_doctor_id in (
      select id from public.doctors where user_id = auth.uid()
    )
  );

-- Exercise completions
create policy "Patients can view their completions" on public.exercise_completions
  for select using (
    patient_id in (
      select id from public.patients where user_id = auth.uid()
    )
  );

create policy "Patients can insert their completions" on public.exercise_completions
  for insert with check (
    patient_id in (
      select id from public.patients where user_id = auth.uid()
    )
  );

create policy "Doctors can view completions of their patients" on public.exercise_completions
  for select using (
    patient_id in (
      select p.id from public.patients p 
      inner join public.doctors d on p.assigned_doctor_id = d.id 
      where d.user_id = auth.uid()
    )
  );

-- Functions to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_updated_at before update on public.doctors
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.patients
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.routines
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.exercises
  for each row execute procedure public.handle_updated_at();

-- Insert some sample exercises
insert into public.exercises (name, description, category, difficulty_level, default_sets, default_reps, instructions) values
('Push-ups', 'Basic upper body exercise targeting chest, shoulders, and triceps', 'upper_body', 2, 3, 10, 'Start in plank position, lower body to ground, push back up'),
('Squats', 'Lower body exercise targeting quadriceps, hamstrings, and glutes', 'lower_body', 2, 3, 15, 'Stand with feet shoulder-width apart, lower as if sitting in chair, return to standing'),
('Plank', 'Core strengthening exercise', 'core', 1, 3, null, 'Hold plank position with straight body line'),
('Lunges', 'Lower body exercise for legs and glutes', 'lower_body', 3, 3, 10, 'Step forward, lower back knee toward ground, return to start'),
('Mountain Climbers', 'Cardio and core exercise', 'cardio', 3, 3, 20, 'Start in plank, alternate bringing knees to chest rapidly')
on conflict do nothing;

-- Insert sample doctor (for demo purposes)
-- Note: In production, doctors would be created through the signup process
insert into public.doctors (id, user_id, email, first_name, last_name, medical_license, specialization, hospital_affiliation, is_verified) values
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'dr.smith@hospital.com', 'John', 'Smith', 'MD123456', 'Physical Therapy', 'General Hospital', true)
on conflict (id) do nothing;

-- Insert sample patients (for demo purposes)  
-- Note: In production, patients would be created through the signup process
insert into public.patients (id, user_id, email, first_name, last_name, date_of_birth, phone, medical_conditions, nft_wallet_address, assigned_doctor_id) values
('660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'patient1@email.com', 'Jane', 'Doe', '1990-05-15', '555-0101', ARRAY['Lower back pain', 'Muscle strain'], '0x1234567890123456789012345678901234567890', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'patient2@email.com', 'Mike', 'Johnson', '1985-08-22', '555-0102', ARRAY['Knee injury', 'Post-surgery rehabilitation'], '0x0987654321098765432109876543210987654321', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'patient3@email.com', 'Sarah', 'Wilson', '1992-12-03', '555-0103', ARRAY['Shoulder impingement', 'Tennis elbow'], '0x1111222233334444555566667777888899990000', '550e8400-e29b-41d4-a716-446655440000')
on conflict (id) do nothing;
