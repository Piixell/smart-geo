import { richiediIdUtente } from '../services/utente';
import React, { useEffect, useState } from 'react';
import { Users, Eye, EyeOff, Edit, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { caricaNascosti } from './CommittenteSelect';

const TABELLE = ['varie', 'ape', 'comune_catasto'] as const;

interface Committente {
  nome: string;
  pratiche: number;
  nascosto: boolean;
}

const caricaCommittenti = async (): Promise<Committente[]> => {
  const userId = await richiediIdUtente();
  const [risultati, nascosti] = await Promise.all([
    Promise.all(TABELLE.map((t) => supabase.from(t).select('committente').eq('user_id', userId).not('committente', 'is', null).limit(10000))),
    caricaNascosti(),
  ]);
  const conteggi = new Map<string, number>();
  risultati.forEach(({ data }) =>
    (data || []).forEach((r: { committente: string }) => {
      const nome = r.committente.trim();
      if (/[a-z0-9]/i.test(nome)) conteggi.set(nome, (conteggi.get(nome) || 0) + 1);
    })
  );
  return [...conteggi.entries()]
    .map(([nome, pratiche]) => ({ nome, pratiche, nascosto: nascosti.has(nome.toLowerCase()) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }));
};

export const CommittentiSection: React.FC = () => {
  const [lista, setLista] = useState<Committente[]>([]);
  const [modifica, setModifica] = useState<string | null>(null);
  const [nuovoNome, setNuovoNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  const ricarica = () => caricaCommittenti().then(setLista).catch(() => toast.error('Errore nel caricamento dei committenti'));
  useEffect(() => {
    ricarica();
  }, []);

  const cambiaVisibilita = async (c: Committente) => {
    const userId = await richiediIdUtente();
    const { error } = c.nascosto
      ? await supabase.from('committenti_nascosti').delete().eq('user_id', userId).eq('nome', c.nome)
      : await supabase.from('committenti_nascosti').insert([{ nome: c.nome, user_id: userId }]);
    if (error) return toast.error('Errore nel salvataggio');
    toast.success(c.nascosto ? `"${c.nome}" di nuovo visibile nel menu` : `"${c.nome}" nascosto dal menu`);
    ricarica();
  };

  const rinomina = async (c: Committente) => {
    const nome = nuovoNome.trim();
    if (!nome || nome === c.nome) return setModifica(null);
    if (!confirm(`Rinominare "${c.nome}" in "${nome}" su tutte le ${c.pratiche} pratiche?`)) return;
    const userId = await richiediIdUtente();
    setSalvando(true);
    const esiti = await Promise.all([
      ...TABELLE.map((t) => supabase.from(t).update({ committente: nome }).eq('committente', c.nome).eq('user_id', userId)),
      supabase.from('rubrica').update({ riferimento: nome }).eq('riferimento', c.nome).eq('user_id', userId),
    ]);
    setSalvando(false);
    if (esiti.some((e) => e.error)) return toast.error('Errore durante la rinomina');
    toast.success(`Committente rinominato in "${nome}"`);
    setModifica(null);
    ricarica();
  };

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700" data-testid="sezione-committenti">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Committenti</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Nascondi i committenti dal menu a tendina delle pratiche o rinominali su tutte le pratiche. Se rinomini con un nome già esistente, i due committenti vengono uniti.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Committente</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pratiche</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nel menu</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {lista.map((c) => (
              <tr key={c.nome} className={c.nascosto ? 'bg-ink-50/60 dark:bg-gray-900/40' : ''} data-testid={`committente-riga-${c.nome}`}>
                <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {modifica === c.nome ? (
                    <input autoFocus value={nuovoNome} onChange={(e) => setNuovoNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && rinomina(c)} className="input w-full max-w-sm" data-testid="committente-rinomina-input" />
                  ) : (
                    <span className={c.nascosto ? 'text-ink-400 line-through' : ''}>{c.nome}</span>
                  )}
                </td>
                <td className="px-6 py-3 text-sm tabular-nums text-ink-600">{c.pratiche}</td>
                <td className="px-6 py-3">
                  <button onClick={() => cambiaVisibilita(c)} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${c.nascosto ? 'text-ink-500 ring-ink-200 hover:bg-ink-100' : 'text-emerald-700 ring-emerald-200 bg-emerald-50 hover:bg-emerald-100'}`} data-testid={`committente-visibilita-${c.nome}`}>
                    {c.nascosto ? <><EyeOff className="h-3.5 w-3.5" /> Nascosto</> : <><Eye className="h-3.5 w-3.5" /> Visibile</>}
                  </button>
                </td>
                <td className="px-6 py-3 text-right">
                  {modifica === c.nome ? (
                    <>
                      <button onClick={() => rinomina(c)} disabled={salvando} className="mr-3 text-emerald-600 hover:text-emerald-800" title="Salva" data-testid="committente-rinomina-salva"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setModifica(null)} className="text-ink-400 hover:text-ink-700" title="Annulla"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <button onClick={() => { setModifica(c.nome); setNuovoNome(c.nome); }} className="text-blue-600 hover:text-blue-800" title="Rinomina" data-testid={`committente-rinomina-${c.nome}`}><Edit className="h-4 w-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
