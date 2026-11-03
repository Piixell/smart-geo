import { supabase } from '../services/supabase';
import { calcolaTotali, type Preventivo, type StatoPreventivo } from './preventivi';
import type { Scadenza } from '../types';
import { cfg } from '../services/impostazioni';
import { leggiTutteLeRighe } from '../services/letture';

export type Sezione = 'comune' | 'varie' | 'ape';

export interface PraticaDash {
  id: number;
  sezione: Sezione;
  committente: string;
  proprieta: string;
  indirizzo: string;
  citta: string;
  stato: string;
  created_at: string;
  acconto: boolean;
  giorniFermo: number;
  gruppo: string;
}

export type Conteggi = Record<Sezione, number> & { totale: number };

export interface DashboardData {
  daFare: Conteggi;
  inIstruttoria: Conteggi;
  daIncassare: Conteggi;
  fatturatoAnno: number;
  onorarioAnno: number;
  fatturatoMesi: { anno: number[]; precedente: number[] };
  ferme: PraticaDash[];
  preventivi: { conteggi: Record<StatoPreventivo, number>; accettatiAnno: number; inAttesa: number };
  scadenze: Scadenza[];
}

export const giorniFermo = () => cfg().pagine.giorniFermo;
export const giorniScadenze = () => cfg().pagine.giorniScadenzeDashboard;
const giorniDa = (d?: string) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 0);

export const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const STATI_CC: Record<number, string> = { 1: 'Da fare', 2: 'Lavori in corso', 3: 'Completata', 4: 'Saltata', 5: 'In istruttoria', 6: 'Lavori terminati' };
const STATI_VARIE: Record<number, string> = { 1: 'Da fare', 2: 'In attesa', 3: 'Completata', 4: 'Saltata', 5: 'In istruttoria' };
const STATI_APE: Record<number, string> = { 1: 'Da fare', 2: 'Pronta', 3: 'Completata', 4: 'Annullata' };

type Riga = { id: number; committente?: string; proprieta?: string; indirizzo?: string; citta?: string; created_at: string; updated_at?: string; acconto?: boolean };
type RigaComune = Riga & { stato: number; saldo: boolean; omaggio: boolean };
type RigaVarie = Riga & { registrazione: number; saldo: boolean; omaggio: boolean };
type RigaApe = Riga & { registrazione: number; pagamento: boolean; omaggio: boolean };
type FatturaDashboard = { anno_fattura: number; mese_fattura: string; fatturato: number; onorario: number | null };
type PreventivoDashboard = Pick<Preventivo, 'id' | 'data' | 'stato' | 'voci' | 'spese_interne' | 'bollo' | 'sconto' | 'parametri_calcolo'>;

const mappa = (r: Riga, sezione: Sezione, statoId: number, etichette: Record<number, string>): PraticaDash => ({
  id: r.id,
  sezione,
  committente: r.committente || '-',
  proprieta: r.proprieta || '-',
  indirizzo: r.indirizzo || '-',
  citta: r.citta || '',
  stato: etichette[statoId] || '-',
  created_at: r.created_at,
  acconto: !!r.acconto,
  giorniFermo: giorniDa(r.updated_at || r.created_at),
  gruppo: sezione === 'varie' ? 'Pratiche varie' : sezione === 'ape' ? 'APE' : 'Comunali e catastali',
});

const somma = <T,>(righe: T[], campo: keyof T) => righe.reduce((t, r) => t + (Number(r[campo]) || 0), 0);

const conta = (pratiche: PraticaDash[]): Conteggi => ({
  comune: pratiche.filter((p) => p.sezione === 'comune').length,
  varie: pratiche.filter((p) => p.sezione === 'varie').length,
  ape: pratiche.filter((p) => p.sezione === 'ape').length,
  totale: pratiche.length,
});

export const caricaDashboard = async (userId: string): Promise<DashboardData> => {
  const anno = new Date().getFullYear();
  const campi = 'id, committente, proprieta, indirizzo, citta, created_at, omaggio';
  const limiteScadenze = new Date(Date.now() + giorniScadenze() * 86400000).toISOString().split('T')[0];
  const [cc, varie, ape, fatture, prev, scad] = await Promise.all([
    leggiTutteLeRighe<RigaComune>((da, a, conta) => supabase.from('comune_catasto')
      .select(`${campi}, updated_at, stato, acconto, saldo`, { count: conta ? 'exact' : undefined })
      .eq('user_id', userId).order('id').range(da, a)),
    leggiTutteLeRighe<RigaVarie>((da, a, conta) => supabase.from('varie')
      .select(`${campi}, registrazione, acconto, saldo`, { count: conta ? 'exact' : undefined })
      .eq('user_id', userId).order('id').range(da, a)),
    leggiTutteLeRighe<RigaApe>((da, a, conta) => supabase.from('ape')
      .select(`${campi}, updated_at, registrazione, pagamento`, { count: conta ? 'exact' : undefined })
      .eq('user_id', userId).order('id').range(da, a)),
    leggiTutteLeRighe<FatturaDashboard>((da, a, conta) => supabase.from('fatture')
      .select('anno_fattura, mese_fattura, fatturato, onorario', { count: conta ? 'exact' : undefined })
      .eq('user_id', userId).gte('anno_fattura', anno - 1).order('id').range(da, a)),
    leggiTutteLeRighe<PreventivoDashboard>((da, a, conta) => supabase.from('preventivi')
      .select('id, data, stato, voci, spese_interne, bollo, sconto, parametri_calcolo', { count: conta ? 'exact' : undefined })
      .eq('user_id', userId).order('id').range(da, a)),
    leggiTutteLeRighe<Scadenza>((da, a, conta) => supabase.from('scadenze')
      .select('*', { count: conta ? 'exact' : undefined }).eq('user_id', userId).eq('pagamento', false)
      .not('data_scadenza', 'is', null).lte('data_scadenza', limiteScadenze)
      .order('data_scadenza').order('id').range(da, a)),
  ]);
  const preventivi = prev;
  const conteggi = { bozza: 0, inviato: 0, accettato: 0, rifiutato: 0 } as Record<StatoPreventivo, number>;
  preventivi.forEach((p) => { conteggi[p.stato] = (conteggi[p.stato] || 0) + 1; });
  const totale = (l: PreventivoDashboard[]) => l.reduce((t, p) => t + calcolaTotali(p).totale, 0);

  const rCC = cc.map((r) => ({ r, p: mappa(r, 'comune', r.stato, STATI_CC) }));
  const rVarie = varie.map((r) => ({ r, p: mappa(r, 'varie', r.registrazione, STATI_VARIE) }));
  const rApe = ape.map((r) => ({ r, p: mappa(r, 'ape', r.registrazione, STATI_APE) }));
  const tutte = [...rCC, ...rVarie, ...rApe];

  const fattAnno = fatture.filter((f) => f.anno_fattura === anno);
  const perMese = (a: number) => MESI.map((m) => somma(fatture.filter((f) => f.anno_fattura === a && f.mese_fattura === m), 'fatturato'));

  const daIncassare = [
    ...rCC.filter(({ r }) => r.stato === 3 && !r.saldo && !r.omaggio),
    ...rVarie.filter(({ r }) => r.registrazione === 3 && !r.saldo && !r.omaggio),
    ...rApe.filter(({ r }) => r.registrazione === 3 && !r.pagamento && !r.omaggio),
  ].map(({ p }) => p);

  return {
    daFare: conta(tutte.filter(({ p }) => p.stato === 'Da fare').map(({ p }) => p)),
    inIstruttoria: conta(tutte.filter(({ p }) => p.stato === 'In istruttoria').map(({ p }) => p)),
    daIncassare: conta(daIncassare),
    fatturatoAnno: somma(fattAnno, 'fatturato'),
    onorarioAnno: somma(fattAnno, 'onorario'),
    fatturatoMesi: { anno: perMese(anno), precedente: perMese(anno - 1) },
    ferme: tutte.map(({ p }) => p).filter((p) => (p.stato === 'Da fare' || p.stato === 'In istruttoria') && p.giorniFermo >= giorniFermo()).sort((a, b) => b.giorniFermo - a.giorniFermo),
    preventivi: {
      conteggi,
      accettatiAnno: totale(preventivi.filter((p) => p.stato === 'accettato' && p.data?.startsWith(String(anno)))),
      inAttesa: totale(preventivi.filter((p) => p.stato === 'inviato')),
    },
    scadenze: scad,
  };
};
