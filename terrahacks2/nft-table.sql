-- Create NFTs table for healthcare rehab app
create table if not exists public.nfts (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  exercise_completion_id uuid references public.exercise_completions(id) on delete cascade not null,
  
  -- NFT Metadata
  name varchar(300) not null,
  description text not null,
  image_url text not null,
  
  -- Blockchain Data
  token_id varchar(100), -- ThirdWeb token ID when minted
  contract_address varchar(42) not null, -- Ethereum contract address
  wallet_address varchar(42) not null, -- Patient's wallet address
  transaction_hash varchar(66), -- Blockchain transaction hash
  block_number bigint, -- Block number when minted
  
  -- Exercise Achievement Data
  exercise_type varchar(200) not null,
  completion_score integer check (completion_score >= 0 and completion_score <= 100),
  difficulty_level varchar(50),
  body_part varchar(100),
  rarity varchar(50), -- Common, Uncommon, Rare, Epic, Legendary
  
  -- NFT Status
  minted boolean default false,
  minted_at timestamp with time zone,
  
  -- Image Generation Info
  ai_generated boolean default false,
  image_prompt text, -- The prompt used to generate the image
  generation_model varchar(100), -- e.g., "gemini-2.0-flash"
  
  -- Metadata
  attributes jsonb, -- Store all NFT attributes as JSON
  metadata_uri text, -- IPFS or external metadata URI if used
  
  -- Tracking
  viewed_by_patient boolean default false,
  viewed_by_doctor boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_nfts_patient_id on public.nfts(patient_id);
create index if not exists idx_nfts_exercise_completion_id on public.nfts(exercise_completion_id);
create index if not exists idx_nfts_wallet_address on public.nfts(wallet_address);
create index if not exists idx_nfts_contract_address on public.nfts(contract_address);
create index if not exists idx_nfts_token_id on public.nfts(token_id);
create index if not exists idx_nfts_minted on public.nfts(minted);
create index if not exists idx_nfts_exercise_type on public.nfts(exercise_type);
create index if not exists idx_nfts_created_at on public.nfts(created_at);

-- Row Level Security Policies for NFTs

-- Patients can view their own NFTs
create policy "Patients can view own NFTs" on public.nfts
  for select using (
    patient_id in (
      select id from public.patients where user_id = auth.uid()
    )
  );

-- Patients can insert their own NFTs (when exercise is completed)
create policy "Patients can insert own NFTs" on public.nfts
  for insert with check (
    patient_id in (
      select id from public.patients where user_id = auth.uid()
    )
  );

-- Patients can update their own NFTs (mark as viewed, etc.)
create policy "Patients can update own NFTs" on public.nfts
  for update using (
    patient_id in (
      select id from public.patients where user_id = auth.uid()
    )
  );

-- Doctors can view NFTs of their assigned patients
create policy "Doctors can view patient NFTs" on public.nfts
  for select using (
    patient_id in (
      select p.id from public.patients p 
      inner join public.doctors d on p.assigned_doctor_id = d.id 
      where d.user_id = auth.uid()
    )
  );

-- Doctors can update NFTs for their patients (mark as viewed by doctor, add feedback, etc.)
create policy "Doctors can update patient NFTs" on public.nfts
  for update using (
    patient_id in (
      select p.id from public.patients p 
      inner join public.doctors d on p.assigned_doctor_id = d.id 
      where d.user_id = auth.uid()
    )
  );

-- Add updated_at trigger
create trigger handle_updated_at_nfts before update on public.nfts
  for each row execute procedure public.handle_updated_at();

-- Enable RLS
alter table public.nfts enable row level security;

-- Add some sample data for testing (optional)
-- You can uncomment this if you want some test data
/*
insert into public.nfts (
  patient_id, 
  exercise_completion_id,
  name,
  description,
  image_url,
  contract_address,
  wallet_address,
  exercise_type,
  completion_score,
  difficulty_level,
  body_part,
  rarity,
  minted,
  ai_generated,
  attributes
) values (
  (select id from public.patients limit 1),
  (select id from public.exercise_completions limit 1),
  'Push-up Champion Achievement',
  'Congratulations on completing your push-up exercises with excellent form!',
  'http://localhost:3000/generated-nfts/nft-1754162025244.png',
  '0x15bfFBC29124dF7609039c3d8AEc946d2053c8Bf',
  '0x009A450db4e92856a9Cb8Ef944fE070F21E06794',
  'Push-ups',
  92,
  'Intermediate',
  'Chest and Arms',
  'Epic',
  true,
  true,
  '{"trait_type": "Exercise Type", "value": "Push-ups"}'::jsonb
);
*/
