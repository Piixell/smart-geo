-- Script per correggere le policy RLS delle tabelle parametri
-- Eseguire questo script nel Supabase SQL Editor per risolvere errori 406

-- Verifica e corregge le policy per parametri_azienda
DROP POLICY IF EXISTS "Users can manage company params" ON parametri_azienda;

-- Policy più permissiva per parametri_azienda (tabella globale)
CREATE POLICY "Allow authenticated users to manage company params" ON parametri_azienda 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verifica e corregge le policy per tipi_incarico
DROP POLICY IF EXISTS "Users can manage assignment types" ON tipi_incarico;

-- Policy più permissiva per tipi_incarico (tabella globale)
CREATE POLICY "Allow authenticated users to manage assignment types" ON tipi_incarico 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verifica e corregge le policy per stati_generali
DROP POLICY IF EXISTS "Users can manage general states" ON stati_generali;

CREATE POLICY "Allow authenticated users to manage general states" ON stati_generali 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verifica e corregge le policy per stati_ape
DROP POLICY IF EXISTS "Users can manage APE states" ON stati_ape;

CREATE POLICY "Allow authenticated users to manage APE states" ON stati_ape 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verifica e corregge le policy per stati_scadenze
DROP POLICY IF EXISTS "Users can manage deadline states" ON stati_scadenze;

CREATE POLICY "Allow authenticated users to manage deadline states" ON stati_scadenze 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verifica e corregge le policy per tipologia_contatti
DROP POLICY IF EXISTS "Users can manage contact types" ON tipologia_contatti;

CREATE POLICY "Allow authenticated users to manage contact types" ON tipologia_contatti 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verifica e corregge le policy per tipologie_appartenenza
DROP POLICY IF EXISTS "Users can manage belonging types" ON tipologie_appartenenza;

CREATE POLICY "Allow authenticated users to manage belonging types" ON tipologie_appartenenza 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Assicurati che RLS sia abilitato per tutte le tabelle
ALTER TABLE parametri_azienda ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipi_incarico ENABLE ROW LEVEL SECURITY;
ALTER TABLE stati_generali ENABLE ROW LEVEL SECURITY;
ALTER TABLE stati_ape ENABLE ROW LEVEL SECURITY;
ALTER TABLE stati_scadenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipologia_contatti ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipologie_appartenenza ENABLE ROW LEVEL SECURITY;

-- Verifica che le policy siano state create correttamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('parametri_azienda', 'tipi_incarico', 'stati_generali', 'stati_ape', 'stati_scadenze', 'tipologia_contatti', 'tipologie_appartenenza')
ORDER BY tablename, policyname; 