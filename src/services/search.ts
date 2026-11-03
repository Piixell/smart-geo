import { richiediIdUtente } from './utente';
import { supabase } from './supabase';

export type SearchTable = 'comune_catasto' | 'ape' | 'varie' | 'rubrica' | 'preventivi' | 'scadenze';

export interface SearchResult {
  id: string;
  table: SearchTable;
  label: string;
  sublabel?: string;
  route: string;
}

type Riga = Record<string, string | null | undefined> & { id: string };

const SEARCH_LIMIT = 10;

const ROTTE: Record<SearchTable, string> = {
  comune_catasto: '/comune-catasto',
  ape: '/ape',
  varie: '/varie',
  rubrica: '/rubrica',
  preventivi: '/preventivi',
  scadenze: '/spese',
};

const CAMPI_PRATICA = ['committente', 'indirizzo', 'citta', 'proprieta', 'proprieta2', 'telefono', 'telefono2', 'mail', 'mail2', 'note'];

const CONFIG: { table: SearchTable; campi: string[]; ordine: string; etichetta: (r: Riga) => string; dettaglio: (r: Riga) => (string | null | undefined)[] }[] = [
  { table: 'comune_catasto', campi: CAMPI_PRATICA, ordine: 'committente', etichetta: (r) => r.committente || 'Senza committente', dettaglio: (r) => [r.indirizzo, r.citta, r.proprieta || r.proprieta2, r.telefono] },
  { table: 'ape', campi: [...CAMPI_PRATICA, 'progressivo'], ordine: 'committente', etichetta: (r) => r.committente || 'Senza committente', dettaglio: (r) => [r.progressivo && `APE ${r.progressivo}`, r.indirizzo, r.citta, r.proprieta || r.proprieta2, r.telefono] },
  { table: 'varie', campi: [...CAMPI_PRATICA, 'tipo_incarico'], ordine: 'committente', etichetta: (r) => r.committente || 'Senza committente', dettaglio: (r) => [r.tipo_incarico, r.indirizzo, r.citta, r.proprieta || r.proprieta2, r.telefono] },
  { table: 'rubrica', campi: ['nominativo', 'telefono', 'email', 'riferimento'], ordine: 'nominativo', etichetta: (r) => r.nominativo || 'Senza nominativo', dettaglio: (r) => [r.telefono, r.email, r.riferimento] },
  { table: 'preventivi', campi: ['numero', 'cliente', 'indirizzo_cliente', 'indirizzo_immobile', 'citta_immobile', 'codice_fiscale_cliente'], ordine: 'created_at', etichetta: (r) => `N° ${r.numero} - ${(r.cliente || '').split('\n').join(' - ')}`, dettaglio: (r) => [r.indirizzo_immobile, r.citta_immobile] },
  { table: 'scadenze', campi: ['descrizione'], ordine: 'descrizione', etichetta: (r) => r.descrizione || 'Spesa', dettaglio: (r) => [r.data_scadenza] },
];

const filtroOr = (term: string, campi: string[]) => {
  const t = term.replace(/[,()]/g, ' ');
  return campi.map((c) => `${c}.ilike.%${t}%`).join(',');
};

export async function searchAll(term: string): Promise<SearchResult[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const userId = await richiediIdUtente();
  const risposte = await Promise.all(
    CONFIG.map(({ table, campi, ordine }) =>
      supabase.from(table).select('*').eq('user_id', userId).or(filtroOr(trimmed, campi)).order(ordine, { ascending: ordine !== 'created_at' }).limit(SEARCH_LIMIT),
    ),
  );

  return CONFIG.flatMap(({ table, etichetta, dettaglio }, i) =>
    ((risposte[i].data || []) as Riga[]).map((r) => ({
      id: `${table}:${r.id}`,
      table,
      label: etichetta(r),
      sublabel: dettaglio(r).filter(Boolean).join(' — ') || undefined,
      route: `${ROTTE[table]}?apri=${r.id}`,
    })),
  );
}
