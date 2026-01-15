-- Script SQL per modificare la tabella rubrica
-- Rimuove i campi: ufficio, tipologia_id, appartenenza_id
-- Aggiunge il campo: riferimento

-- 1. Aggiungere la colonna riferimento (testo libero)
ALTER TABLE rubrica 
ADD COLUMN IF NOT EXISTS riferimento TEXT;

-- 2. Rimuovere le colonne non più necessarie
-- NOTA: Prima di eseguire queste operazioni, assicurati di aver fatto un backup dei dati

-- Rimuovere la colonna ufficio
ALTER TABLE rubrica 
DROP COLUMN IF EXISTS ufficio;

-- Rimuovere la colonna tipologia_id
ALTER TABLE rubrica 
DROP COLUMN IF EXISTS tipologia_id;

-- Rimuovere la colonna appartenenza_id
ALTER TABLE rubrica 
DROP COLUMN IF EXISTS appartenenza_id;

-- OPZIONALE: Se vuoi rimuovere anche le tabelle di lookup che non sono più utilizzate:
-- (Decommentare solo se sei sicuro che non siano utilizzate da altre parti dell'applicazione)

-- DROP TABLE IF EXISTS tipologia_contatti;
-- DROP TABLE IF EXISTS tipologie_appartenenza;
