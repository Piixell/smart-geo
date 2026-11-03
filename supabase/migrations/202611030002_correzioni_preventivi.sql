-- Applicare dopo 202611030001_integrazione_emergent.sql, prima del frontend aggiornato.
-- Espansione additiva: nessuna cancellazione e nessun ricalcolo delle voci dei documenti.
BEGIN;
SET LOCAL search_path = pg_catalog;

ALTER TABLE public.preventivi
  ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS parametri_calcolo jsonb;

-- Se note era già presente, conserva il contenuto e normalizza soltanto i NULL.
UPDATE public.preventivi SET note = '' WHERE note IS NULL;
ALTER TABLE public.preventivi ALTER COLUMN note SET DEFAULT '';
ALTER TABLE public.preventivi ALTER COLUMN note SET NOT NULL;

CREATE OR REPLACE FUNCTION public.conserva_calcolo_preventivo()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $funzione$
DECLARE
  fisco jsonb;
  anno integer;
  anno_cambio integer := 2027;
  cassa numeric := 5;
  coefficiente numeric := 78;
  aliquota_fino numeric := 5;
  aliquota_dal numeric := 15;
BEGIN
  -- Anche un vecchio frontend non può sostituire i parametri di un documento consolidato.
  IF TG_OP = 'UPDATE' THEN
    IF OLD.parametri_calcolo IS NOT NULL THEN
      NEW.parametri_calcolo := OLD.parametri_calcolo;
      RETURN NEW;
    END IF;
  END IF;
  IF NEW.parametri_calcolo IS NOT NULL THEN RETURN NEW; END IF;

  anno := extract(year FROM NEW.data)::integer;
  SELECT i.dati->'fisco' INTO fisco FROM public.impostazioni i WHERE i.user_id = NEW.user_id;
  IF (CASE WHEN jsonb_typeof(fisco->'cassa') = 'number'
    THEN (fisco->>'cassa')::numeric BETWEEN 0 AND 100 ELSE false END) THEN
    cassa := (fisco->>'cassa')::numeric;
  END IF;
  IF (CASE WHEN jsonb_typeof(fisco->'coefficiente') = 'number'
    THEN (fisco->>'coefficiente')::numeric BETWEEN 0 AND 100 ELSE false END) THEN
    coefficiente := (fisco->>'coefficiente')::numeric;
  END IF;
  IF (CASE WHEN jsonb_typeof(fisco->'aliquotaFino') = 'number'
    THEN (fisco->>'aliquotaFino')::numeric BETWEEN 0 AND 100 ELSE false END) THEN
    aliquota_fino := (fisco->>'aliquotaFino')::numeric;
  END IF;
  IF (CASE WHEN jsonb_typeof(fisco->'aliquotaDal') = 'number'
    THEN (fisco->>'aliquotaDal')::numeric BETWEEN 0 AND 100 ELSE false END) THEN
    aliquota_dal := (fisco->>'aliquotaDal')::numeric;
  END IF;
  IF (CASE WHEN jsonb_typeof(fisco->'annoCambio') = 'number'
    THEN (fisco->>'annoCambio')::numeric BETWEEN 1900 AND 9999 ELSE false END) THEN
    anno_cambio := ceil((fisco->>'annoCambio')::numeric)::integer;
  END IF;
  NEW.parametri_calcolo := jsonb_build_object(
    'versione', 1, 'anno', anno, 'cassa', cassa, 'coefficiente', coefficiente,
    'aliquota', CASE WHEN anno >= anno_cambio THEN aliquota_dal ELSE aliquota_fino END,
    'origine', CASE WHEN TG_OP = 'INSERT' THEN 'salvataggio' ELSE 'ricostruzione' END
  );
  RETURN NEW;
END;
$funzione$;

DROP TRIGGER IF EXISTS conserva_calcolo_preventivo ON public.preventivi;
CREATE TRIGGER conserva_calcolo_preventivo BEFORE INSERT OR UPDATE ON public.preventivi
FOR EACH ROW EXECUTE FUNCTION public.conserva_calcolo_preventivo();

-- I parametri originali mai registrati non sono recuperabili. Ricostruzione una tantum
-- dalla data del documento e dalle impostazioni disponibili del suo proprietario.
-- Il trigger marca questi record e non li ricostruisce alle successive esecuzioni.
UPDATE public.preventivi SET parametri_calcolo = NULL WHERE parametri_calcolo IS NULL;

ALTER TABLE public.preventivi DROP CONSTRAINT IF EXISTS preventivi_parametri_calcolo_validi;
ALTER TABLE public.preventivi ADD CONSTRAINT preventivi_parametri_calcolo_validi CHECK (
  parametri_calcolo IS NOT NULL AND jsonb_typeof(parametri_calcolo) = 'object'
  AND parametri_calcolo ?& ARRAY['versione','anno','cassa','coefficiente','aliquota','origine']
  AND parametri_calcolo->'versione' = '1'::jsonb
  AND jsonb_typeof(parametri_calcolo->'anno') = 'number'
  AND (parametri_calcolo->>'anno')::numeric BETWEEN 1900 AND 9999
  AND (parametri_calcolo->>'anno')::numeric = trunc((parametri_calcolo->>'anno')::numeric)
  AND jsonb_typeof(parametri_calcolo->'cassa') = 'number'
  AND (parametri_calcolo->>'cassa')::numeric BETWEEN 0 AND 100
  AND jsonb_typeof(parametri_calcolo->'coefficiente') = 'number'
  AND (parametri_calcolo->>'coefficiente')::numeric BETWEEN 0 AND 100
  AND jsonb_typeof(parametri_calcolo->'aliquota') = 'number'
  AND (parametri_calcolo->>'aliquota')::numeric BETWEEN 0 AND 100
  AND jsonb_typeof(parametri_calcolo->'origine') = 'string'
  AND parametri_calcolo->>'origine' IN ('salvataggio', 'ricostruzione')
);

REVOKE ALL ON FUNCTION public.conserva_calcolo_preventivo() FROM PUBLIC, anon;
NOTIFY pgrst, 'reload schema';
COMMIT;
