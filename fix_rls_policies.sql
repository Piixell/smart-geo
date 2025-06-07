-- Script per sistemare le policy RLS che causano errore 406
-- Eseguire questo script nel Supabase SQL Editor

-- Elimina le policy esistenti per la tabella profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Ricrea le policy per la tabella profiles
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Verifica che RLS sia abilitato
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy alternative più permissiva se il problema persiste
-- (decommentare solo se necessario)
/*
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Allow authenticated users to view profiles" ON profiles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update own profile" ON profiles 
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile" ON profiles 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
*/ 