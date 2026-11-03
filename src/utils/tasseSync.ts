import { supabase } from '../services/supabase';
import { cfg } from '../services/impostazioni';

const RE_SALDO = /^Saldo tasse maturate nell'anno \d{4}$/;
const RE_INTEGRATIVO = /^Contributo integrativo maturato nell'anno \d{4}$/;
const RE_ACCONTI = /^[12]° acconto tasse maturate nell'anno \d{4}$/;
// Acconti automatici (50% delle tasse dell'anno precedente) dal 2026
const PRIMO_ANNO_ACCONTI = 2026;
// Contributo integrativo automatico dal 2025, saldo dal 2026 (il saldo 2025 resta manuale)
const PRIMO_ANNO_INTEGRATIVO = 2025;
const PRIMO_ANNO_SALDO = 2026;

// Voci di Spese calcolate dai totali di Contabilità (saldo = tasse dell'anno meno acconti pagati)
const VOCE_SALDO = (anno: number) => `Saldo tasse maturate nell'anno ${anno}`;
const VOCE_INTEGRATIVO = (anno: number) => `Contributo integrativo maturato nell'anno ${anno}`;
const VOCE_SOGGETTIVO = (anno: number) => `Contributo soggettivo e maternità maturati nell'anno ${anno}`;
const VOCE_ACCONTO = (n: 1 | 2, anno: number) => `${n}° acconto tasse maturate nell'anno ${anno}`;
const arrotonda = (n: number) => Math.round(n * 100) / 100;

export const isVoceSoggettivoMaternita = (descrizione?: string | null) => !!descrizione?.startsWith('Contributo soggettivo e maternità');

// Ordine delle spese variabili: acconti, integrativo, soggettivo e maternità, saldo
export const ordineVariabile = (descrizione?: string | null) => {
  const d = descrizione || '';
  if (d.startsWith('1° acconto')) return 0;
  if (d.startsWith('2° acconto')) return 1;
  if (d.startsWith('Contributo integrativo')) return 2;
  if (d.startsWith('Contributo soggettivo')) return 3;
  if (d.startsWith('Saldo tasse')) return 4;
  return 5;
};

const spostaAnno = (data: string, anni: number) => {
  const md = data.slice(5) === '02-29' ? '02-28' : data.slice(5);
  return `${Number(data.slice(0, 4)) + anni}-${md}`;
};

// Saldo tasse: anno di maturazione (si mostra anche in quell'anno per accantonare i soldi)
export const annoMaturazioneSaldo = (descrizione?: string | null) =>
  descrizione && RE_SALDO.test(descrizione) ? Number(descrizione.slice(-4)) : null;

// Voci ricalcolate a ogni sincronizzazione con Contabilità
export const isSpesaTasseAutomatica = (descrizione?: string | null) => {
  if (!descrizione) return false;
  const anno = Number(descrizione.slice(-4));
  const annoCorrente = new Date().getFullYear();
  if (RE_ACCONTI.test(descrizione)) return anno >= PRIMO_ANNO_ACCONTI && anno >= annoCorrente;
  if (RE_INTEGRATIVO.test(descrizione)) return anno >= Math.max(PRIMO_ANNO_INTEGRATIVO, annoCorrente - 1);
  return RE_SALDO.test(descrizione) && anno >= Math.max(PRIMO_ANNO_SALDO, annoCorrente - 1);
};

// Acconti visibili solo dall'anno in cui vanno pagati
export const isAccontoFuturo = (descrizione?: string | null) =>
  !!descrizione && RE_ACCONTI.test(descrizione) && Number(descrizione.slice(-4)) > new Date().getFullYear();

export type CategoriaSpesa = 'variabili' | 'fissi';

export const categoriaSpesa = (s: { descrizione?: string | null; categoria?: string | null }): CategoriaSpesa => {
  if (s.categoria === 'fissi' || s.categoria === 'variabili') return s.categoria;
  const d = (s.descrizione || '').toLowerCase();
  return d.includes('tasse') || d.includes('contributo integrativo') || d.includes('contributo soggettivo') ? 'variabili' : 'fissi';
};

const sincronizzazioni = new Map<string, Promise<void>>();

export const sincronizzaTasseInSpese = (userId: string): Promise<void> => {
  const esistente = sincronizzazioni.get(userId);
  if (esistente) return esistente;
  const promessa = eseguiSync(userId).finally(() => { sincronizzazioni.delete(userId); });
  sincronizzazioni.set(userId, promessa);
  return promessa;
};

// La funzione SQL serializza le richieste e preserva pagamenti e doppioni esistenti.
const allineaVoce = async (userId: string, descrizione: string, importo: number, scadenza: string | null) => {
  const { error } = await supabase.rpc('allinea_spesa_automatica', {
    p_user_id: userId, p_descrizione: descrizione, p_importo: importo, p_scadenza: scadenza,
  });
  if (error) throw error;
};

const creaSoggettivoSeManca = async (userId: string, descrizione: string, scadenza: string) => {
  const { error } = await supabase.rpc('allinea_spesa_automatica', {
    p_user_id: userId, p_descrizione: descrizione, p_importo: cfg().fisco.maternita, p_scadenza: scadenza,
    p_solo_creazione: true, p_maternita: cfg().fisco.maternita,
  });
  if (error) throw error;
};

const eseguiSync = async (userId: string): Promise<void> => {
  const annoCorrente = new Date().getFullYear();

  const fatture: { anno_fattura: number; tasse: number; onorario: number }[] = [];
  for (let da = 0; ; da += 1000) {
    const { data, error } = await supabase.from('fatture')
      .select('anno_fattura, tasse, onorario').eq('user_id', userId)
      .gte('anno_fattura', annoCorrente - 1).order('id').range(da, da + 999);
    if (error) throw error;
    fatture.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  const totaleAnno = (anno: number, campo: 'tasse' | 'onorario') =>
    (fatture || []).filter((f) => f.anno_fattura === anno).reduce((s, f) => s + (Number(f[campo]) || 0), 0);

  const anni = new Set<number>([annoCorrente - 1, annoCorrente, ...(fatture || []).map((f) => f.anno_fattura).filter((a) => a >= annoCorrente)]);

  // Scadenza: stessa data della voce dell'anno precedente spostata di un anno, altrimenti una data tipica
  const { data: voci } = await supabase.from('scadenze').select('descrizione, data_scadenza').eq('user_id', userId);
  const scadenzaDa = (voce: (a: number) => string, anno: number, annoPagamento: number, predefinita: string) => {
    for (let k = 1; k <= 5; k++) {
      const prev = (voci || []).find((v) => v.descrizione === voce(anno - k))?.data_scadenza;
      if (prev) return spostaAnno(prev, k);
    }
    return `${annoPagamento}-${predefinita}`;
  };

  const { fisco, scadenze: date } = cfg();
  // 1° e 2° acconto: percentuale delle tasse dell'anno precedente (anno in corso e successivo)
  for (const anno of [annoCorrente, annoCorrente + 1]) {
    if (anno < PRIMO_ANNO_ACCONTI) continue;
    const acconto = arrotonda(totaleAnno(anno - 1, 'tasse') * fisco.acconto / 100);
    await allineaVoce(userId, VOCE_ACCONTO(1, anno), acconto, scadenzaDa((a) => VOCE_ACCONTO(1, a), anno, anno, date.acconto1));
    await allineaVoce(userId, VOCE_ACCONTO(2, anno), acconto, scadenzaDa((a) => VOCE_ACCONTO(2, a), anno, anno, date.acconto2));
  }

  // Soggettivo e maternità: si riferiscono all'anno in cui si pagano
  await creaSoggettivoSeManca(userId, VOCE_SOGGETTIVO(annoCorrente), scadenzaDa(VOCE_SOGGETTIVO, annoCorrente, annoCorrente, date.soggettivo));

  for (const anno of anni) {
    if (anno < PRIMO_ANNO_INTEGRATIVO) continue;
    // Contributo integrativo: 5% dell'onorario dell'anno, da versare l'anno successivo
    const scadenzaContributi = scadenzaDa(VOCE_INTEGRATIVO, anno, anno + 1, date.integrativo);
    await allineaVoce(userId, VOCE_INTEGRATIVO(anno), arrotonda(totaleAnno(anno, 'onorario') * fisco.cassa / 100), scadenzaContributi);
    if (anno < PRIMO_ANNO_SALDO) continue;

    const { data: acconti, error: errAcc } = await supabase
      .from('scadenze')
      .select('spese')
      .eq('user_id', userId)
      .eq('pagamento', true)
      .in('descrizione', [VOCE_ACCONTO(1, anno), VOCE_ACCONTO(2, anno)]);
    if (errAcc) throw errAcc;
    const accontiPagati = (acconti || []).reduce((s, a) => s + (Number(a.spese) || 0), 0);
    await allineaVoce(userId, VOCE_SALDO(anno), Math.max(0, arrotonda(totaleAnno(anno, 'tasse') - accontiPagati)), scadenzaDa(VOCE_SALDO, anno, anno + 1, date.saldo));
  }
};
