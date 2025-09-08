-- Migration: Add name and surname fields to profiles table
-- This script adds name and surname fields to the existing profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS surname VARCHAR(100);

-- Update existing profiles with default values if needed
UPDATE profiles 
SET name = CASE 
    WHEN username IS NOT NULL AND username != '' THEN username
    ELSE 'Utente'
END,
surname = ''
WHERE name IS NULL AND surname IS NULL;

-- Make name required after initial migration
ALTER TABLE profiles 
ALTER COLUMN name SET NOT NULL;

-- Update the handle_new_user function to include name fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, surname)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'surname', '')
  );
  
  -- Crea le categorie planner di default per il nuovo utente
  INSERT INTO public.planner_categories (user_id, slug, name, color, order_position) VALUES
  (new.id, 'riunioni', 'Riunioni', '#ef4444', 1),
  (new.id, 'sopralluoghi', 'Sopralluoghi', '#3b82f6', 2),
  (new.id, 'uffici', 'Uffici', '#10b981', 3),
  (new.id, 'studio', 'Studio', '#f59e0b', 4);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;