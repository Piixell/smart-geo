import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import { richiediIdUtente } from './utente';

export interface Impostazioni {
  fisco: { coefficiente: number; cassa: number; acconto: number; maternita: number; aliquotaFino: number; aliquotaDal: number; annoCambio: number; bolloImporto: number; bolloSoglia: number };
  scadenze: { acconto1: string; acconto2: string; saldo: string; integrativo: string; soggettivo: string };
  preventivi: { firma: string; luogo: string; piede: string[]; intro: string; note: string; bollo: number; logoPdf: string };
  pagine: { giorniFermo: number; giorniAvvisoSpese: number; giorniScadenzeDashboard: number; righePratiche: number; mappaLat: number; mappaLon: number };
  aspetto: { nome: string; sottotitolo: string; nomeCompleto: string; coloreBarra: string; logo: string; coloreBottoni: string; coloreSfondo: string; dimensioneTesto: number; titoloScheda: string };
  menu: Record<string, string>;
}

export const PREDEFINITE: Impostazioni = {
  fisco: { coefficiente: 78, cassa: 5, acconto: 50, maternita: 30, aliquotaFino: 5, aliquotaDal: 15, annoCambio: 2027, bolloImporto: 2, bolloSoglia: 77.47 },
  scadenze: { acconto1: '06-30', acconto2: '11-30', saldo: '06-30', integrativo: '09-30', soggettivo: '09-30' },
  preventivi: {
    firma: 'Geom. Andrea ZUCARO',
    luogo: 'San Mauro Torinese',
    piede: [
      'Geometra Andrea Zucaro\nVia Monte Grappa n° 10\nSan Mauro Torinese (TO)',
      'C.F. ZCRNDR00D10L219O\nPartita IVA: 12658470013\nN° iscrizione albo: 10347',
      'studio@geometrazucaro.it\nandrea.zucaro@geopec.it\nCellulare: 371 361 7406',
    ],
    intro: 'ringraziando per la gradita richiesta formulo di seguito la previsione di spesa comprensiva di onorario, cassa di previdenza e assistenza geometri e spese anticipate per Vs conto relativi a quanto riportato di seguito.',
    note: [
      'suddetto preventivo di spesa ha una validità temporanea pari a trenta giorni;',
      'sono previsti un acconto pari al 50 % ed un saldo a conclusione delle prestazioni;',
      'dal presente preventivo di spesa sono da intendersi esclusi:',
      '- sanzione amministrativa minima pari a 516,00 € per opere riconducibili ad abusi (soggetta ad eventuale conguaglio a seguito di istruttoria);',
      '- sanzione amministrativa pari a 1.000,00 € per opere riconducibili ad abusi;',
      '- possibili richieste aggiuntive da parte degli enti preposti che non siano imputabili alla parte;',
      '- particolari prestazioni professionali non elencate.',
    ].join('\n'),
    bollo: 4,
    logoPdf: '',
  },
  pagine: { giorniFermo: 60, giorniAvvisoSpese: 15, giorniScadenzeDashboard: 30, righePratiche: 1000, mappaLat: 45.0703, mappaLon: 7.6869 },
  aspetto: {
    nome: 'Andrea Zucaro', sottotitolo: 'Geometra', nomeCompleto: 'Andrea Zucaro Geometra', coloreBarra: '#171717', logo: '',
    coloreBottoni: '#262626', coloreSfondo: '#FAFAFA', dimensioneTesto: 100, titoloScheda: 'Andrea Zucaro Geometra · Gestionale Studio Tecnico',
  },
  menu: {
    gruppoPratiche: 'Pratiche', gruppoAmministrazione: 'Amministrazione', gruppoConfigurazione: 'Configurazione',
    '/': 'Dashboard', '/planner': 'Agenda settimanale', '/comune-catasto': 'Pratiche comunali e catastali',
    '/ape': 'Attestati di Prestazione Energetica', '/varie': 'Pratiche varie', '/preventivi': 'Preventivi',
    '/contabilita': 'Contabilità', '/spese': 'Spese', '/rubrica': 'Rubrica', '/parametri': 'Parametri di sistema',
  },
};

// Le impostazioni restano in memoria e vengono azzerate al cambio account.
// Non conservare dati dello studio in una cache condivisa sul dispositivo.
try { localStorage.removeItem('impostazioni-gestionale'); } catch { /* memoria non disponibile */ }

const oggetto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const immagineValida = (v: string) => v === '' ||
  (v.length <= 700000 && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(v));
const dataValida = (v: string) => {
  if (!/^\d{2}-\d{2}$/.test(v)) return false;
  const data = new Date(`2000-${v}T00:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(5, 10) === v;
};

// Accetta soltanto chiavi note e valori dello stesso tipo dei predefiniti.
// Colori e immagini hanno formati chiusi: vengono usati in CSS e nei PDF.
const unisci = (dati: unknown): Impostazioni => {
  const risultato = structuredClone(PREDEFINITE);
  if (!oggetto(dati)) return risultato;
  for (const gruppo of Object.keys(PREDEFINITE) as (keyof Impostazioni)[]) {
    const sorgente = dati[gruppo];
    if (!oggetto(sorgente)) continue;
    const destinazione = risultato[gruppo] as unknown as Record<string, unknown>;
    for (const chiave of Object.keys(destinazione)) {
      const valore = sorgente[chiave];
      const predefinito = destinazione[chiave];
      if (typeof predefinito === 'string' && typeof valore === 'string' && valore.length <= 20000) {
        if (chiave.startsWith('colore') && !/^#[0-9a-f]{6}$/i.test(valore)) continue;
        if ((chiave === 'logo' || chiave === 'logoPdf') && !immagineValida(valore)) continue;
        if (gruppo === 'scadenze' && !dataValida(valore)) continue;
        destinazione[chiave] = valore;
      } else if ((chiave === 'logo' || chiave === 'logoPdf') && typeof valore === 'string' && immagineValida(valore)) {
        destinazione[chiave] = valore;
      } else if (typeof predefinito === 'number' && typeof valore === 'number' && Number.isFinite(valore)) {
        let minimo = 0;
        let massimo = 100000;
        if (gruppo === 'fisco' && ['coefficiente', 'cassa', 'acconto', 'aliquotaFino', 'aliquotaDal'].includes(chiave)) massimo = 100;
        if (chiave === 'mappaLat') { minimo = -90; massimo = 90; }
        if (chiave === 'mappaLon') { minimo = -180; massimo = 180; }
        if (chiave === 'dimensioneTesto') { minimo = 50; massimo = 200; }
        if (chiave === 'righePratiche') { minimo = 1; massimo = 1000; }
        if (chiave === 'annoCambio') { minimo = 1900; massimo = 9999; }
        if (valore >= minimo && valore <= massimo) destinazione[chiave] = valore;
      } else if (chiave === 'piede' && Array.isArray(valore) && valore.length === 3 && valore.every((v) => typeof v === 'string' && v.length <= 10000)) {
        destinazione[chiave] = [...valore];
      }
    }
  }
  return risultato;
};

let corrente: Impostazioni = unisci(null);
let utenteAttivo: string | undefined;
const ascoltatori = new Set<() => void>();
const imposta = (nuove: Impostazioni) => {
  corrente = nuove;
  ascoltatori.forEach((f) => f());
};
supabase.auth.onAuthStateChange((_evento, sessione) => {
  const id = sessione?.user.id;
  if (id !== utenteAttivo) {
    utenteAttivo = id;
    imposta(unisci(null));
  }
});

export const cfg = () => corrente;

export const caricaImpostazioni = async () => {
  const userId = await richiediIdUtente();
  const { data, error } = await supabase.from('impostazioni').select('dati').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (await richiediIdUtente() === userId) imposta(unisci(data?.dati));
};

export const salvaImpostazioni = async (nuove: Impostazioni) => {
  const userId = await richiediIdUtente();
  const validate = unisci(nuove);
  const { error } = await supabase.from('impostazioni').upsert({ user_id: userId, dati: validate, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
  if (await richiediIdUtente() === userId) imposta(validate);
};

export const useImpostazioni = () =>
  useSyncExternalStore((f) => { ascoltatori.add(f); return () => { ascoltatori.delete(f); }; }, cfg);
