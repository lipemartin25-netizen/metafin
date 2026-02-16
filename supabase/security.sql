-- SECURITY ENHANCEMENT SCRIPT --
-- Execute this in the Supabase SQL Editor to secure your database against unauthorized access.

-- 1. Enable Row Level Security (RLS) on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Users can only View their own transactions
CREATE POLICY "Users can only view their own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Create Policy: Users can only Insert their own transactions
CREATE POLICY "Users can only insert their own transactions" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Create Policy: Users can only Update their own transactions
CREATE POLICY "Users can only update their own transactions" 
ON transactions FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Create Policy: Users can only Delete their own transactions
CREATE POLICY "Users can only delete their own transactions" 
ON transactions FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Secure Profiles (if exists) - Optional, creating just in case
-- CREATE TABLE IF NOT EXISTS profiles (
--   id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
--   updated_at TIMESTAMP WITH TIME ZONE,
--   username TEXT UNIQUE,
--   full_name TEXT,
--   avatar_url TEXT
-- );
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
-- CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
