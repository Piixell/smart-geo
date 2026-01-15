-- Add telefono2 field to varie table
ALTER TABLE varie 
ADD COLUMN telefono2 VARCHAR(20);

-- Add comment to the field
COMMENT ON COLUMN varie.telefono2 IS 'Secondo numero di telefono';