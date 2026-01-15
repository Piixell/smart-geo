-- Update the varie table to change tipo_incarico_id to tipo_incarico (text field)
-- First, drop the foreign key constraint if it exists
ALTER TABLE varie DROP CONSTRAINT IF EXISTS varie_tipo_incarico_id_fkey;

-- Then, drop the column if it exists
ALTER TABLE varie DROP COLUMN IF EXISTS tipo_incarico_id;

-- Add the new text field
ALTER TABLE varie ADD COLUMN tipo_incarico VARCHAR(255);

-- Add comment to the field
COMMENT ON COLUMN varie.tipo_incarico IS 'Tipo di incarico (campo di testo libero)';