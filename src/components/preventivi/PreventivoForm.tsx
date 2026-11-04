import { richiediIdUtente } from '../../services/utente';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, Home, Plus, Trash2, Printer, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { calcolaTotali, creaParametriCalcolo, normalizzaPreventivo, type Preventivo } from '../../utils/preventivi';
import { esportaPreventivoPdf } from '../../utils/preventivoPdf';
import { caricaPrestazioni, type Prestazione } from '../PrestazioniSection';
import { VociPreventivo } from './VociPreventivo';
import { RigheEditor } from './RigheEditor';
import { StatoPreventivoStepper } from './StatoPreventivoStepper';
import { ImportoInput } from './ImportoInput';
import { SpeseInterne } from './SpeseInterne';
import { nomeCliente, oggettoAutomatico, salutoAutomatico } from '../../utils/saluto';
import { CommittenteSelect } from '../CommittenteSelect';
import { siglaProvincia, type SuggerimentoMappa } from '../../services/mappe';


const RATE = [
  { label: 'Unica soluzione', bollo: 2 },
  { label: 'Acconto + saldo', bollo: 4 },
  { label: '2 acconti + saldo', bollo: 6 },
];

const euro = (v: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v);

interface Props {
  iniziale: Preventivo;
  onClose: () => void;
  onSaved: () => void;
}

const Campo: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-xs font-medium text-ink-600 dark:text-gray-300">{label}</span>
    {children}
  </label>
);

export const PreventivoForm: React.FC<Props> = ({ iniziale, onClose, onSaved }) => {
  const [p, setP] = useState<Preventivo>(() => normalizzaPreventivo(iniziale));
  const [prestazioni, setPrestazioni] = useState<Prestazione[]>([]);
  const [salvando, setSalvando] = useState(false);
  const t = calcolaTotali(p);

  useEffect(() => {
    caricaPrestazioni().then(setPrestazioni).catch(() => toast.error('Errore nel caricamento delle prestazioni'));
  }, []);

  const set = <K extends keyof Preventivo>(k: K, v: Preventivo[K]) => setP((prev) => {
    const aggiornato = { ...prev, [k]: v };
    if (k === 'data' && !prev.id && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
      && Number(v.slice(0, 4)) >= 1900 && Number(v.slice(0, 4)) <= 9999) {
      aggiornato.parametri_calcolo = creaParametriCalcolo(v);
    }
    return aggiornato;
  });
  const localitaCliente = (s: SuggerimentoMappa) => setP((prev) => ({
    ...prev,
    citta_cliente: (s.citta || prev.citta_cliente || '').toUpperCase(),
    cap_cliente: s.cap || prev.cap_cliente,
    provincia_cliente: s.provincia ? siglaProvincia(s.provincia).toUpperCase() : prev.provincia_cliente,
  }));
  const MAIUSCOLO = ['codice_fiscale_cliente', 'cap_cliente', 'citta_cliente', 'provincia_cliente', 'paese_cliente'];
  const input = (k: 'codice_fiscale_cliente' | 'indirizzo_immobile' | 'citta_immobile' | 'cap_cliente' | 'citta_cliente' | 'provincia_cliente' | 'paese_cliente', placeholder = '') => (
    <input value={p[k] || ''} onChange={(e) => setP((prev) => ({ ...prev, [k]: MAIUSCOLO.includes(k) ? e.target.value.toUpperCase() : e.target.value, ...(MAIUSCOLO.includes(k) ? {} : { oggetto: '' }) }))} placeholder={placeholder} autoComplete="off" className={`input w-full ${MAIUSCOLO.includes(k) ? 'uppercase' : ''}`} data-testid={`preventivo-${k}-input`} />
  );
  const nomi = p.cliente.split('\n');
  const setNomi = (n: string[]) => setP((prev) => ({ ...prev, cliente: n.join('\n'), saluto: '' }));
  const setNome = (i: number, v: string) => setNomi(nomi.map((n, k) => (k === i ? v.toUpperCase() : n)));

  const salva = async (poiPdf = false, firmaDigitale = false) => {
    if (salvando) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.data) || Number(p.data.slice(0, 4)) < 1900 || Number(p.data.slice(0, 4)) > 9999) {
      return toast.error('Inserisci una data valida per il preventivo');
    }
    if (!p.cliente.trim()) return toast.error('Inserisci il cliente');
    if (!p.citta_immobile.trim()) return toast.error("Inserisci la città dell'immobile");
    if (!p.indirizzo_immobile.trim()) return toast.error("Inserisci l'indirizzo dell'immobile");
    if (p.voci.length === 0) return toast.error('Aggiungi almeno una prestazione');
    setSalvando(true);
    try {
      const userId = await richiediIdUtente();
      const id = p.id;
      const dati = { ...p };
      delete dati.id;
      delete dati.created_at;
      const payload = { ...dati, user_id: userId, cliente: nomi.map((n) => n.trim()).filter(Boolean).join('\n'), saluto: salutoAutomatico(p.cliente), oggetto: oggettoAutomatico(p.citta_immobile, p.indirizzo_immobile), updated_at: new Date().toISOString() };
      const { data, error } = id
        ? await supabase.from('preventivi').update(payload).eq('id', id).eq('user_id', userId).select().single()
        : await supabase.from('preventivi').insert([payload]).select().single();
      if (error) throw error;
      toast.success('Preventivo salvato');
      if (poiPdf) await esportaPreventivoPdf(data as Preventivo, firmaDigitale);
      onSaved();
    } catch (errore) {
      console.error('Errore nel salvataggio o esportazione del preventivo:', errore);
      toast.error('Operazione non riuscita. Verifica il salvataggio del preventivo prima di riprovare.');
    } finally {
      setSalvando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/45 backdrop-blur-sm p-2 sm:p-6" data-testid="preventivo-form">
      <div className="form-animato w-full max-w-5xl rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <header className="flex items-center justify-between border-b border-ink-100 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">{p.id ? `Preventivo n° ${p.numero} - ${nomeCliente(p.cliente)}` : `Nuovo preventivo n° ${p.numero}`}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700" data-testid="preventivo-chiudi"><X className="h-6 w-6" /></button>
        </header>
        {p.parametri_calcolo?.origine === 'ricostruzione' && (
          <p className="mx-6 mt-4 rounded-md bg-ink-100 p-3 text-sm text-ink-700" role="status">
            Per questo preventivo precedente all’aggiornamento, il calcolo è stato ricostruito con i parametri disponibili. Verifica gli importi rispetto al documento originale.
          </p>
        )}

        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Campo label="Data"><input type="date" value={p.data} onChange={(e) => set('data', e.target.value)} className="input w-full" data-testid="preventivo-data-input" /></Campo>
            <Campo label="Stato" className="col-span-2 md:col-span-3">
              <StatoPreventivoStepper valore={p.stato} onChange={(s) => set('stato', s)} testId="preventivo-stato" />
            </Campo>
          </div>

          <section className="rounded-xl border-2 border-sky-200 bg-sky-50/50 p-4 dark:border-sky-900 dark:bg-sky-950/20" data-testid="preventivo-sezione-cliente">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-800 dark:text-sky-300"><User className="h-4 w-4" /> 1. Dati del cliente (intestatario)</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Campo label="Clienti *">
                <div className="space-y-1.5">
                  {nomi.map((n, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input value={n} onChange={(e) => setNome(i, e.target.value)} placeholder={`NOME E COGNOME CLIENTE ${i + 1}`} autoComplete="off" className="input w-full uppercase" data-testid={`preventivo-cliente-${i}-input`} />
                      {nomi.length > 1 && <button type="button" onClick={() => setNomi(nomi.filter((_, k) => k !== i))} className="text-red-400 hover:text-red-600" title="Rimuovi cliente" data-testid={`preventivo-cliente-${i}-elimina`}><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  <button type="button" onClick={() => setNomi([...nomi, ''])} className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900" data-testid="preventivo-cliente-aggiungi"><Plus className="h-3.5 w-3.5" /> Aggiungi cliente</button>
                </div>
              </Campo>
              <div className="space-y-3">
                <Campo label="Residenza / sede del cliente">
                  <CommittenteSelect campo="indirizzo" maiuscolo obbligatorio={false} value={p.indirizzo_cliente || ''} onChange={(v) => set('indirizzo_cliente', v)} onScelta={localitaCliente} testId="preventivo-indirizzo_cliente-input" placeholder="" />
                </Campo>
                <div className="grid grid-cols-[6rem_1fr] gap-3">
                  <Campo label="CAP">{input('cap_cliente')}</Campo>
                  <Campo label="Città"><CommittenteSelect campo="citta" maiuscolo obbligatorio={false} value={p.citta_cliente || ''} onChange={(v) => set('citta_cliente', v)} onScelta={localitaCliente} testId="preventivo-citta_cliente-input" placeholder="" /></Campo>
                </div>
                <div className="grid grid-cols-[6rem_1fr] gap-3">
                  <Campo label="Provincia">{input('provincia_cliente')}</Campo>
                  <Campo label="Paese">{input('paese_cliente')}</Campo>
                </div>
              </div>
              <Campo label="Codice fiscale / P.IVA cliente">{input('codice_fiscale_cliente')}</Campo>
            </div>
          </section>

          <section className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4 dark:border-neutral-700 dark:bg-white/[0.03]" data-testid="preventivo-sezione-immobile">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200/80"><Home className="h-4 w-4" /> 2. Immobile oggetto del preventivo</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo label="Città dell'immobile *"><CommittenteSelect campo="citta" obbligatorio={false} value={p.citta_immobile || ''} onChange={(v) => setP((prev) => ({ ...prev, citta_immobile: v, oggetto: '' }))} testId="preventivo-citta_immobile-input" placeholder="Città" /></Campo>
              <Campo label="Indirizzo dell'immobile *"><CommittenteSelect campo="indirizzo" obbligatorio={false} value={p.indirizzo_immobile || ''} onChange={(v) => setP((prev) => ({ ...prev, indirizzo_immobile: v, oggetto: '' }))} onCitta={(c) => setP((prev) => ({ ...prev, citta_immobile: c, oggetto: '' }))} testId="preventivo-indirizzo_immobile-input" placeholder="Indirizzo immobile" /></Campo>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4">
            <Campo label="Saluto nella lettera">
              <input value={salutoAutomatico(p.cliente)} readOnly tabIndex={-1} className="input w-full cursor-not-allowed bg-gray-100 text-gray-600" data-testid="preventivo-saluto-input" />
            </Campo>
            <Campo label="Oggetto"><input value={oggettoAutomatico(p.citta_immobile, p.indirizzo_immobile)} readOnly tabIndex={-1} className="input w-full cursor-not-allowed bg-gray-100 text-gray-600" data-testid="preventivo-oggetto-input" /></Campo>
          </div>

          <VociPreventivo voci={p.voci} prestazioni={prestazioni} onChange={(v) => set('voci', v)} />

          <SpeseInterne righe={p.spese_interne} onChange={(r) => set('spese_interne', r)} perCategoria={t.perCategoria} tasse={t.tasse} speseEsatte={t.speseEsatte} spese={t.spese} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <span className="mb-1 block text-xs font-medium text-ink-600 dark:text-gray-300">Note e condizioni (compaiono nel PDF; trascina per riordinare, usa la freccia per trasformare una condizione in sottovoce)</span>
              <RigheEditor value={p.note} onChange={(v) => set('note', v)} testId="preventivo-note" placeholder="nota" aggiungi="Aggiungi condizione" sottovoci />
            </div>
            <div className="rounded-xl bg-ink-50 p-4 text-sm dark:bg-gray-700/50" data-testid="preventivo-riepilogo">
              <div className="flex items-center justify-between py-1 text-ink-600 dark:text-gray-300"><span>Onorario</span><span className="tabular-nums">{euro(t.onorarioLordo)}</span></div>
              <div className="flex items-center justify-between gap-2 py-1 text-ink-600 dark:text-gray-300">
                <span>Sconto onorario</span>
                <span className="flex items-center gap-1">
                  <ImportoInput valore={p.sconto || 0} onChange={(v) => set('sconto', v)} className="input w-24 px-2 py-1 text-right text-sm tabular-nums" testId="preventivo-sconto-input" />
                  <span className="text-xs">€</span>
                </span>
              </div>
              {t.scontoImporto > 0 && <div className="flex justify-between py-1 font-medium text-ink-800 dark:text-gray-200"><span>Onorario scontato</span><span className="tabular-nums" data-testid="preventivo-onorario-scontato">{euro(t.onorario)}</span></div>}
              {t.scontoImporto > 0 && <div className="flex justify-between py-1 text-xs text-red-600"><span>Sconto C.I.P.A.G.</span><span className="tabular-nums">-{euro(t.scontoCassa)}</span></div>}
              {[[`C.I.P.A.G. ${t.percentualeCassa}%`, t.cassa], ['Spese anticipate per Vs conto', t.spese]].map(([l, v]) => (
                <div key={l as string} className="flex justify-between py-1 text-ink-600 dark:text-gray-300"><span>{l}</span><span className="tabular-nums">{euro(v as number)}</span></div>
              ))}
              <div className="py-1" data-testid="preventivo-rate">
                <span className="mb-1 block text-xs text-ink-500">Pagamento</span>
                <div className="flex gap-1" role="radiogroup">
                  {RATE.map((r, i) => (
                    <button key={r.bollo} type="button" onClick={() => set('bollo', r.bollo)} className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ring-1 transition-colors ${p.bollo === r.bollo ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-100'}`} data-testid={`preventivo-rate-${i + 1}`}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-1 text-ink-600 dark:text-gray-300">
                <span>Imposta di bollo</span>
                <input type="number" step="0.01" min="0" value={p.bollo} onChange={(e) => set('bollo', parseFloat(e.target.value) || 0)} className="input w-24 py-1 text-right text-sm tabular-nums" data-testid="preventivo-bollo-input" />
              </div>
              <div className="mt-2 flex justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-900 dark:text-white"><span>Totale prestazione</span><span className="tabular-nums" data-testid="preventivo-totale">{euro(t.totale)}</span></div>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-6 py-4 dark:border-gray-700">
          <button onClick={onClose} className="btn btn-secondary" data-testid="preventivo-annulla">Annulla</button>
          <button onClick={() => salva(true, true)} disabled={salvando} className="btn btn-secondary flex items-center gap-2" data-testid="preventivo-salva-pdf-firmato"><FileCheck className="h-4 w-4" /> Salva e PDF firma digitale</button>
          <button onClick={() => salva(true, false)} disabled={salvando} className="btn btn-secondary flex items-center gap-2" data-testid="preventivo-salva-pdf-da-firmare"><Printer className="h-4 w-4" /> Salva e PDF firma a mano</button>
          <button onClick={() => salva()} disabled={salvando} className="btn btn-primary flex items-center gap-2" data-testid="preventivo-salva"><Save className="h-4 w-4" /> Salva</button>
        </footer>
      </div>
    </div>, document.body
  );
};
