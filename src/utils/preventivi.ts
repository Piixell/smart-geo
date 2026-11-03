import { supabase } from '../services/supabase';
import { cfg } from '../services/impostazioni';
import { aliquotaTasse } from './aliquotaTasse';

export interface VocePreventivo {
  descrizione: string;
  dettagli: string;
  onorario: number;
}

export type CategoriaSpesaInterna = 'comune' | 'catasto' | 'varie';

export interface SpesaInterna {
  categoria: CategoriaSpesaInterna;
  descrizione: string;
  importo: number;
}

export type StatoPreventivo = 'bozza' | 'inviato' | 'accettato' | 'rifiutato';

export interface ParametriCalcoloPreventivo {
  versione: 1;
  anno: number;
  cassa: number;
  coefficiente: number;
  aliquota: number;
  origine: 'salvataggio' | 'ricostruzione';
}

export interface Preventivo {
  id?: number;
  created_at?: string;
  numero: string;
  data: string;
  cliente: string;
  saluto: string;
  indirizzo_cliente: string;
  codice_fiscale_cliente: string;
  cap_cliente?: string;
  citta_cliente?: string;
  provincia_cliente?: string;
  paese_cliente?: string;
  email_cliente: string;
  oggetto: string;
  indirizzo_immobile: string;
  citta_immobile: string;
  voci: VocePreventivo[];
  spese_interne: SpesaInterna[];
  bollo: number;
  sconto?: number;
  note: string;
  stato: StatoPreventivo;
  parametri_calcolo?: ParametriCalcoloPreventivo | null;
}

export const STATI_PREVENTIVO: { id: StatoPreventivo; label: string; classe: string }[] = [
  { id: 'bozza', label: 'Bozza', classe: 'bg-ink-100 text-ink-700' },
  { id: 'inviato', label: 'Inviato', classe: 'bg-blue-100 text-blue-800' },
  { id: 'accettato', label: 'Accettato', classe: 'bg-emerald-100 text-emerald-800' },
  { id: 'rifiutato', label: 'Rifiutato', classe: 'bg-red-100 text-red-700' },
];

export const CATEGORIE_SPESE: { id: CategoriaSpesaInterna; label: string }[] = [
  { id: 'comune', label: 'Comune' },
  { id: 'catasto', label: 'Catasto' },
  { id: 'varie', label: 'Varie' },
];

export const notePredefinite = () => cfg().preventivi.note;

const n = (v: unknown) => Number(v) || 0;
const arrotonda = (v: number) => Math.round(v * 100) / 100;

export const creaParametriCalcolo = (
  data: string,
  origine: ParametriCalcoloPreventivo['origine'] = 'salvataggio',
): ParametriCalcoloPreventivo => {
  const anno = Number(data.slice(0, 4));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || anno < 1900 || anno > 9999) {
    throw new Error('Data del preventivo non valida');
  }
  const { cassa, coefficiente } = cfg().fisco;
  return { versione: 1, anno, cassa, coefficiente, aliquota: aliquotaTasse(anno) * 100, origine };
};

type DatiCalcolo = Pick<Preventivo, 'id' | 'data' | 'voci' | 'spese_interne' | 'bollo' | 'sconto' | 'parametri_calcolo'>;

const parametriDelPreventivo = (p: DatiCalcolo): ParametriCalcoloPreventivo => {
  const parametri = p.parametri_calcolo;
  if (parametri == null) return creaParametriCalcolo(p.data, p.id ? 'ricostruzione' : 'salvataggio');
  if (parametri.versione !== 1 || !Number.isInteger(parametri.anno) || parametri.anno < 1900 || parametri.anno > 9999
    || !['salvataggio', 'ricostruzione'].includes(parametri.origine)
    || ![parametri.cassa, parametri.coefficiente, parametri.aliquota].every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100)) {
    throw new Error('Parametri di calcolo del preventivo non validi');
  }
  return parametri;
};

// Tasse = (onorario + bollo) × coefficiente × aliquota dell'anno; spese al cliente arrotondate all'euro superiore
export const calcolaTotali = (p: DatiCalcolo) => {
  const { cassa: pCassa, coefficiente, aliquota } = parametriDelPreventivo(p);
  const quotaCassa = pCassa / 100;
  const onorarioLordo = arrotonda(p.voci.reduce((t, v) => t + n(v.onorario), 0));
  const scontoImporto = arrotonda(Math.min(onorarioLordo, Math.max(0, n(p.sconto))));
  const onorario = arrotonda(onorarioLordo - scontoImporto);
  const bollo = n(p.bollo);
  const cassa = arrotonda(onorario * quotaCassa);
  const tasse = arrotonda((onorario + bollo) * (coefficiente / 100) * (aliquota / 100));
  const perCategoria = Object.fromEntries(CATEGORIE_SPESE.map((c) => [c.id, arrotonda((p.spese_interne || []).filter((s) => s.categoria === c.id).reduce((t, s) => t + n(s.importo), 0))])) as Record<CategoriaSpesaInterna, number>;
  const speseEsatte = arrotonda(Object.values(perCategoria).reduce((t, v) => t + v, 0) + tasse);
  const spese = Math.ceil(speseEsatte - 0.0001);
  const cassaLorda = arrotonda(onorarioLordo * quotaCassa);
  return { onorarioLordo, scontoImporto, cassaLorda, percentualeCassa: pCassa, scontoCassa: arrotonda(cassaLorda - arrotonda(onorario * quotaCassa)), onorario, cassa, bollo, tasse, perCategoria, speseEsatte, spese, totale: arrotonda(onorario + cassa + spese + bollo) };
};

export const prossimoNumero = async (userId: string, anno: number) => {
  const { data } = await supabase.from('preventivi').select('numero').eq('user_id', userId).like('numero', `%/${anno}`);
  const max = (data || []).reduce((m, r) => Math.max(m, parseInt(r.numero, 10) || 0), 0);
  return `${max + 1}/${anno}`;
};

const RIGHE_SPESE_DEFAULT = [['comune', 6], ['catasto', 4], ['varie', 6]] as const;

// Sottovoci delle note marcate con "- "; le note vecchie senza marcatori: sottovoci dopo una riga con ":"
export const normalizzaPreventivo = (p: Preventivo): Preventivo => {
  const spese = [...(p.spese_interne || [])];
  RIGHE_SPESE_DEFAULT.forEach(([categoria, n]) => {
    for (let i = spese.filter((s) => s.categoria === categoria).length; i < n; i++) spese.push({ categoria, descrizione: '', importo: 0 });
  });
  const righe = (p.note ?? notePredefinite()).split('\n');
  let dopoDuePunti = false;
  const note = righe.some((r) => /^\s*-/.test(r)) ? righe.join('\n') : righe.map((r) => {
    const sotto = dopoDuePunti;
    if (r.trim().endsWith(':')) dopoDuePunti = true;
    return sotto && r.trim() ? `- ${r.trim()}` : r;
  }).join('\n');
  return { ...p, spese_interne: spese, note, parametri_calcolo: parametriDelPreventivo(p) };
};

const SPESE_PREDEFINITE: [CategoriaSpesaInterna, string, number][] = [
  ['comune', 'accesso agli atti', 12.89],
  ['comune', 'accesso agli atti', 12.89],
  ['comune', 'accesso agli atti', 12.89],
  ['comune', 'diritti di segreteria CILA', 57.92],
  ['catasto', 'unità immobiliare', 70],
  ['catasto', 'unità immobiliare', 70],
  ['varie', 'diritti APE', 15],
  ['varie', 'benzina', 10],
  ['varie', 'stampa', 10],
];

export const preventivoVuoto = (numero: string): Preventivo => normalizzaPreventivo({
  numero,
  data: new Date().toISOString().split('T')[0],
  cliente: '',
  saluto: '',
  indirizzo_cliente: '',
  codice_fiscale_cliente: '',
  cap_cliente: '',
  citta_cliente: '',
  provincia_cliente: '',
  paese_cliente: 'ITALIA',
  email_cliente: '',
  oggetto: '',
  indirizzo_immobile: '',
  citta_immobile: '',
  voci: [],
  spese_interne: SPESE_PREDEFINITE.map(([categoria, descrizione, importo]) => ({ categoria, descrizione, importo })),
  bollo: cfg().preventivi.bollo,
  sconto: 0,
  note: notePredefinite(),
  stato: 'bozza',
});
