-- Disable Row Level Security on the nfts table
-- This allows the client-side code to read NFT data directly

ALTER TABLE public.nfts DISABLE ROW LEVEL SECURITY;

-- Optional: If you want to re-enable it later, use:
-- ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;

-- You can also check the current RLS status with:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'nfts';
