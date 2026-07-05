import { supabase } from './supabase';

export type SearchTable = 'comune_catasto' | 'ape' | 'varie' | 'rubrica';

export interface SearchResult {
  id: string;
  table: SearchTable;
  label: string;
  sublabel?: string;
  route: string;
}

interface RawRow {
  id: string;
  committente?: string;
  nominativo?: string;
  indirizzo?: string;
  proprieta?: string;
  proprieta2?: string;
  progressivo?: string;
}

const SEARCH_LIMIT = 10;

function buildSublabel(row: RawRow, table: SearchTable): string | undefined {
  const parts: string[] = [];

  if (table === 'ape' && row.progressivo) {
    parts.push(`APE ${row.progressivo}`);
  }

  if (row.indirizzo) {
    parts.push(row.indirizzo);
  }

  const prop = row.proprieta || row.proprieta2;
  if (prop) {
    parts.push(prop);
  }

  return parts.length > 0 ? parts.join(' — ') : undefined;
}

function buildOrFilter(term: string, fields: string[]): string {
  const escaped = term.replace(/,/g, '\\,');
  return fields.map((f) => `${f}.ilike.%${escaped}%`).join(',');
}

export async function searchAll(term: string): Promise<SearchResult[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const comuneOr = buildOrFilter(trimmed, [
    'committente',
    'indirizzo',
    'proprieta',
    'proprieta2',
  ]);

  const apeOr = buildOrFilter(trimmed, [
    'committente',
    'indirizzo',
    'proprieta',
    'proprieta2',
    'progressivo',
  ]);

  const varieOr = comuneOr;

  const rubricaOr = buildOrFilter(trimmed, ['nominativo']);

  const [comune, ape, varie, rubrica] = await Promise.all([
    supabase
      .from('comune_catasto')
      .select('id, committente, indirizzo, proprieta, proprieta2')
      .or(comuneOr)
      .order('committente', { ascending: true })
      .limit(SEARCH_LIMIT),
    supabase
      .from('ape')
      .select('id, committente, indirizzo, proprieta, proprieta2, progressivo')
      .or(apeOr)
      .order('committente', { ascending: true })
      .limit(SEARCH_LIMIT),
    supabase
      .from('varie')
      .select('id, committente, indirizzo, proprieta, proprieta2')
      .or(varieOr)
      .order('committente', { ascending: true })
      .limit(SEARCH_LIMIT),
    supabase
      .from('rubrica')
      .select('id, nominativo')
      .or(rubricaOr)
      .eq('disattivato', false)
      .order('nominativo', { ascending: true })
      .limit(SEARCH_LIMIT),
  ]);

  const results: SearchResult[] = [];

  if (comune.data) {
    for (const row of comune.data as RawRow[]) {
      results.push({
        id: `comune_catasto:${row.id}`,
        table: 'comune_catasto',
        label: row.committente || 'Senza committente',
        sublabel: buildSublabel(row, 'comune_catasto'),
        route: '/comune-catasto',
      });
    }
  }

  if (ape.data) {
    for (const row of ape.data as RawRow[]) {
      results.push({
        id: `ape:${row.id}`,
        table: 'ape',
        label: row.committente || 'Senza committente',
        sublabel: buildSublabel(row, 'ape'),
        route: '/ape',
      });
    }
  }

  if (varie.data) {
    for (const row of varie.data as RawRow[]) {
      results.push({
        id: `varie:${row.id}`,
        table: 'varie',
        label: row.committente || 'Senza committente',
        sublabel: buildSublabel(row, 'varie'),
        route: '/varie',
      });
    }
  }

  if (rubrica.data) {
    for (const row of rubrica.data as RawRow[]) {
      results.push({
        id: `rubrica:${row.id}`,
        table: 'rubrica',
        label: row.nominativo || 'Senza nominativo',
        sublabel: undefined,
        route: '/rubrica',
      });
    }
  }

  return results;
}
