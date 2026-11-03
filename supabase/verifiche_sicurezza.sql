-- Solo lettura: eseguire nel SQL Editor dopo le migrazioni.
-- Questi risultati descrivono la configurazione reale del database remoto.
SELECT c.relname AS tabella, c.relrowsecurity AS rls_attiva,
  has_table_privilege('anon', c.oid, 'SELECT') AS lettura_anonima,
  has_table_privilege('anon', c.oid, 'INSERT') AS inserimento_anonimo,
  has_table_privilege('anon', c.oid, 'UPDATE') AS modifica_anonima,
  has_table_privilege('anon', c.oid, 'DELETE') AS eliminazione_anonima
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

SELECT tablename AS tabella, policyname AS regola, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT p.proname AS funzione, p.prosecdef AS esegue_come_proprietario,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS eseguibile_anonimamente
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('allinea_spesa_automatica', 'riproponi_costi_fissi');
