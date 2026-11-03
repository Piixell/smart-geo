import { richiediIdUtente } from '../services/utente';
import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus, Trash2, Check, X, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';

export interface TipoIncaricoVarie {
  id: number;
  descrizione: string;
  ape: boolean;
}

export const caricaTipiIncaricoVarie = async (): Promise<TipoIncaricoVarie[]> => {
  const userId = await richiediIdUtente();
  const { data, error } = await supabase.from('tipi_incarico_varie').select('id, descrizione, ape').eq('user_id', userId);
  if (error) throw error;
  return (data || []).sort((a, b) => a.descrizione.localeCompare(b.descrizione, 'it'));
};

const VUOTO = { descrizione: '', ape: false };

export const TipiIncaricoVarieSection: React.FC = () => {
  const [tipi, setTipi] = useState<TipoIncaricoVarie[]>([]);
  const [modifica, setModifica] = useState<number | 'nuovo' | null>(null);
  const [form, setForm] = useState(VUOTO);

  const ricarica = () => caricaTipiIncaricoVarie().then(setTipi).catch(() => toast.error('Errore nel caricamento dei tipi incarico'));
  useEffect(() => {
    ricarica();
  }, []);

  const apri = (t?: TipoIncaricoVarie) => {
    setModifica(t ? t.id : 'nuovo');
    setForm(t ? { descrizione: t.descrizione, ape: t.ape } : VUOTO);
  };

  const salva = async () => {
    const userId = await richiediIdUtente();
    const descrizione = form.descrizione.trim();
    if (!descrizione) return toast.error('Inserisci il nome del tipo incarico');
    const payload = { user_id: userId, descrizione, ape: form.ape };
    const { error } = modifica === 'nuovo'
      ? await supabase.from('tipi_incarico_varie').insert([payload])
      : await supabase.from('tipi_incarico_varie').update(payload).eq('id', modifica as number).eq('user_id', userId);
    if (error) return toast.error(error.code === '23505' ? 'Questo tipo incarico esiste già' : 'Errore nel salvataggio');
    toast.success('Tipo incarico salvato');
    setModifica(null);
    ricarica();
  };

  const elimina = async (t: TipoIncaricoVarie) => {
    const userId = await richiediIdUtente();
    if (!confirm(`Eliminare "${t.descrizione}"? Le pratiche già salvate mantengono il loro tipo.`)) return;
    const { error } = await supabase.from('tipi_incarico_varie').delete().eq('id', t.id).eq('user_id', userId);
    if (error) return toast.error('Errore nell\'eliminazione');
    toast.success('Tipo incarico eliminato');
    ricarica();
  };

  const rigaForm = (
    <tr className="bg-ink-50 dark:bg-gray-700/50" data-testid="tipi-varie-form">
      <td className="px-6 py-3">
        <input autoFocus value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salva()} placeholder="Es. Perizia + APE" className="input w-full" data-testid="tipi-varie-descrizione-input" />
      </td>
      <td className="px-6 py-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.ape} onChange={(e) => setForm({ ...form, ape: e.target.checked })} data-testid="tipi-varie-ape-checkbox" />
          Crea anche APE
        </label>
      </td>
      <td className="px-6 py-3 text-right">
        <button onClick={salva} className="mr-3 text-emerald-600 hover:text-emerald-800" title="Salva" data-testid="tipi-varie-salva"><Check className="h-4 w-4" /></button>
        <button onClick={() => setModifica(null)} className="text-ink-400 hover:text-ink-700" title="Annulla" data-testid="tipi-varie-annulla"><X className="h-4 w-4" /></button>
      </td>
    </tr>
  );

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700" data-testid="sezione-tipi-incarico-varie">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tipi di Incarico Pratiche Varie</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Voci del menu "Tipo Incarico" delle pratiche varie. Con "Crea anche APE" la pratica viene creata anche negli Attestati di prestazione energetica.</p>
          </div>
        </div>
        <button onClick={() => apri()} className="btn btn-primary flex items-center gap-2" data-testid="tipi-varie-nuovo">
          <Plus className="h-4 w-4" /> Nuovo Tipo Incarico
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descrizione</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">APE</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {modifica === 'nuovo' && rigaForm}
            {tipi.map((t) => modifica === t.id ? <React.Fragment key={t.id}>{rigaForm}</React.Fragment> : (
              <tr key={t.id} data-testid={`tipi-varie-riga-${t.id}`}>
                <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">{t.descrizione}</td>
                <td className="px-6 py-3 text-sm">{t.ape ? <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Crea anche APE</span> : <span className="text-ink-400">-</span>}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => apri(t)} className="mr-3 text-blue-600 hover:text-blue-800" title="Modifica" data-testid={`tipi-varie-modifica-${t.id}`}><Edit className="h-4 w-4" /></button>
                  <button onClick={() => elimina(t)} className="text-red-600 hover:text-red-800" title="Elimina" data-testid={`tipi-varie-elimina-${t.id}`}><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
