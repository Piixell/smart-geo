import { richiediIdUtente } from '../services/utente';
import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Trash2, Check, X, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';

export interface Prestazione {
  id: number;
  descrizione: string;
  onorario: number;
  dettagli: string;
}

export const caricaPrestazioni = async (): Promise<Prestazione[]> => {
  const userId = await richiediIdUtente();
  const { data, error } = await supabase.from('prestazioni').select('id, descrizione, onorario, dettagli').eq('user_id', userId);
  if (error) throw error;
  return (data || []).sort((a, b) => a.descrizione.localeCompare(b.descrizione, 'it'));
};

import { RigheEditor } from './preventivi/RigheEditor';

const euro = (v: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v);
const VUOTO = { descrizione: '', onorario: '', dettagli: '' };

export const PrestazioniSection: React.FC = () => {
  const [lista, setLista] = useState<Prestazione[]>([]);
  const [modifica, setModifica] = useState<number | 'nuovo' | null>(null);
  const [form, setForm] = useState(VUOTO);

  const ricarica = () => caricaPrestazioni().then(setLista).catch(() => toast.error('Errore nel caricamento delle prestazioni'));
  useEffect(() => {
    ricarica();
  }, []);

  const apri = (p?: Prestazione) => {
    setModifica(p ? p.id : 'nuovo');
    setForm(p ? { descrizione: p.descrizione, onorario: String(p.onorario), dettagli: p.dettagli || '' } : VUOTO);
  };

  const salva = async () => {
    const userId = await richiediIdUtente();
    const descrizione = form.descrizione.trim();
    if (!descrizione) return toast.error('Inserisci la descrizione della prestazione');
    const payload = { user_id: userId, descrizione, dettagli: form.dettagli, onorario: parseFloat(form.onorario.replace(',', '.')) || 0 };
    const { error } = modifica === 'nuovo'
      ? await supabase.from('prestazioni').insert([payload])
      : await supabase.from('prestazioni').update(payload).eq('id', modifica as number).eq('user_id', userId);
    if (error) return toast.error(error.code === '23505' ? 'Questa prestazione esiste già' : 'Errore nel salvataggio');
    toast.success('Prestazione salvata');
    setModifica(null);
    ricarica();
  };

  const elimina = async (p: Prestazione) => {
    const userId = await richiediIdUtente();
    if (!confirm(`Eliminare "${p.descrizione}"? I preventivi già fatti non cambiano.`)) return;
    const { error } = await supabase.from('prestazioni').delete().eq('id', p.id).eq('user_id', userId);
    if (error) return toast.error('Errore nell\'eliminazione');
    toast.success('Prestazione eliminata');
    ricarica();
  };

  const rigaForm = (
    <tr className="bg-ink-50 dark:bg-gray-700/50" data-testid="prestazioni-form">
      <td className="px-6 py-3">
        <input autoFocus value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} placeholder="Es. SEGNALAZIONE CERTIFICATA DI INIZIO ATTIVITÀ - S.C.I.A." className="input w-full" data-testid="prestazioni-descrizione-input" />
        <span className="mb-1 mt-3 block text-xs font-medium text-ink-600">Righe di default (consistente in), inserite in automatico nel preventivo</span>
        <RigheEditor value={form.dettagli} onChange={(d) => setForm((f) => ({ ...f, dettagli: d }))} testId="prestazioni-dettagli" />
        <div className="mt-4 flex gap-2">
          <button onClick={salva} className="btn btn-primary flex items-center gap-2" data-testid="prestazioni-salva"><Check className="h-4 w-4" /> Salva</button>
          <button onClick={() => setModifica(null)} className="btn btn-secondary flex items-center gap-2" data-testid="prestazioni-annulla"><X className="h-4 w-4" /> Annulla</button>
        </div>
      </td>
      <td className="px-6 py-3 align-top">
        <input type="number" step="0.01" min="0" value={form.onorario} onChange={(e) => setForm({ ...form, onorario: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salva()} placeholder="0,00" className="input w-36" data-testid="prestazioni-onorario-input" />
      </td>
      <td className="px-6 py-3" />
    </tr>
  );

  return (
    <div id="prestazioni" className="card scroll-mt-4 dark:bg-gray-800 dark:border-gray-700" data-testid="sezione-prestazioni">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prestazioni professionali</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Aggiungi o modifica le prestazioni dei preventivi, con onorario proposto e attività (consistente in) inserite in automatico.</p>
          </div>
        </div>
        <button onClick={() => apri()} className="btn btn-primary flex items-center gap-2" data-testid="prestazioni-nuova">
          <Plus className="h-4 w-4" /> Nuova Prestazione
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Prestazione</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Onorario</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {modifica === 'nuovo' && rigaForm}
            {lista.length === 0 && modifica !== 'nuovo' && (
              <tr><td colSpan={3} className="px-6 py-6 text-center text-sm text-ink-500">Nessuna prestazione: aggiungi la prima con "Nuova Prestazione".</td></tr>
            )}
            {lista.map((p) => modifica === p.id ? <React.Fragment key={p.id}>{rigaForm}</React.Fragment> : (
              <tr key={p.id} data-testid={`prestazione-riga-${p.id}`}>
                <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                  <span className="font-medium">{p.descrizione}</span>
                  {p.dettagli && <ol className="mt-1 list-decimal pl-5 text-xs text-ink-500">{p.dettagli.split('\n').filter(Boolean).map((r, k) => <li key={k}>{r}</li>)}</ol>}
                </td>
                <td className="px-6 py-3 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{euro(Number(p.onorario))}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => apri(p)} className="mr-3 text-blue-600 hover:text-blue-800" title="Modifica" data-testid={`prestazione-modifica-${p.id}`}><Edit className="h-4 w-4" /></button>
                  <button onClick={() => elimina(p)} className="text-red-600 hover:text-red-800" title="Elimina" data-testid={`prestazione-elimina-${p.id}`}><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
