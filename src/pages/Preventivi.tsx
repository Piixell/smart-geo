import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Plus, Pencil, Trash2, CopyPlus, Search, X, Printer, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { calcolaTotali, prossimoNumero, preventivoVuoto, STATI_PREVENTIVO, type Preventivo, type StatoPreventivo } from '../utils/preventivi';
import { esportaPreventivoPdf } from '../utils/preventivoPdf';
import { PreventivoForm } from '../components/preventivi/PreventivoForm';
import { StatoPreventivoStepper } from '../components/preventivi/StatoPreventivoStepper';
import { nomeCliente } from '../utils/saluto';
import { useApriDaRicerca } from '../hooks/useApriDaRicerca';
import { useFiltroDashboard } from '../hooks/useFiltroDashboard';

const euro = (v: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v);

export const Preventivi: React.FC = () => {
  const { user } = useAuthStore();
  const [lista, setLista] = useState<Preventivo[]>([]);
  const [aperto, setAperto] = useState<Preventivo | null>(null);
  const [filtroStato, setFiltroStato] = useState<StatoPreventivo | ''>('');
  const [cerca, setCerca] = useState('');
  useApriDaRicerca<Preventivo>('preventivi', (r) => setAperto(r));
  useFiltroDashboard(!!user?.id, ({ nuovo: crea }) => {
    if (crea) nuovo();
  });

  const ricarica = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('preventivi').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).order('id', { ascending: false });
    setLista((data as Preventivo[]) || []);
  };
  useEffect(() => {
    ricarica();
  }, [user?.id]);

  const nuovo = async (base?: Preventivo) => {
    if (!user?.id) return;
    const numero = await prossimoNumero(user.id, new Date().getFullYear());
    setAperto(base ? { ...base, id: undefined, created_at: undefined, parametri_calcolo: undefined, numero, data: new Date().toISOString().split('T')[0], stato: 'bozza' } : preventivoVuoto(numero));
  };

  const cambiaStato = async (p: Preventivo, stato: StatoPreventivo) => {
    const { error } = await supabase.from('preventivi').update({ stato }).eq('id', p.id!).eq('user_id', user?.id);
    if (error) return toast.error('Errore nel cambio stato');
    toast.success(`Preventivo ${STATI_PREVENTIVO.find((s) => s.id === stato)?.label.toLowerCase()}`);
    ricarica();
  };

  const elimina = async (p: Preventivo) => {
    if (!confirm(`Eliminare il preventivo di ${nomeCliente(p.cliente)}?`)) return;
    const { error } = await supabase.from('preventivi').delete().eq('id', p.id!).eq('user_id', user?.id);
    if (error) return toast.error('Errore nell\'eliminazione');
    toast.success('Preventivo eliminato');
    ricarica();
  };

  const testo = cerca.trim().toLowerCase();
  const visibili = lista.filter((p) =>
    (!filtroStato || p.stato === filtroStato) &&
    (!testo || [p.numero, p.cliente, p.indirizzo_immobile, p.citta_immobile].some((v) => (v || '').toLowerCase().includes(testo))),
  );

  return (
    <div className="space-y-4" data-testid="pagina-preventivi">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preventivi</h1>
          <p className="text-gray-600 dark:text-gray-400">Crea preventivi dalle prestazioni preimpostate ed esportali in PDF</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/parametri#prestazioni" className="btn btn-secondary flex items-center gap-2" data-testid="preventivi-gestisci-prestazioni"><Settings className="h-4 w-4" /> Prestazioni professionali</Link>
          <button onClick={() => nuovo()} className="btn btn-primary flex items-center gap-2" data-testid="preventivi-nuovo"><Plus className="h-4 w-4" /> Nuovo Preventivo</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cerca per numero, cliente o immobile" className="input w-full pl-9 pr-8" data-testid="preventivi-cerca-input" />
          {cerca && <button onClick={() => setCerca('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" title="Cancella ricerca" data-testid="preventivi-cerca-cancella"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ id: '' as const, label: 'Tutti' }, ...STATI_PREVENTIVO].map((s) => (
            <button key={s.id} onClick={() => setFiltroStato(s.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${filtroStato === s.id ? 'bg-ink-900 text-white ring-ink-900' : 'text-ink-600 ring-ink-200 hover:bg-ink-50'}`} data-testid={`preventivi-filtro-${s.id || 'tutti'}`}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full tabella-mobile">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
              <tr>
                {['N°', 'Data', 'Cliente', 'Immobile', 'Totale', 'Stato', ''].map((h) => <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {visibili.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-ink-500">Nessun preventivo. Prima aggiungi le prestazioni in Parametri di sistema, poi crea il primo preventivo.</td></tr>}
              {visibili.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/60 dark:hover:bg-gray-700/50" data-testid={`preventivo-riga-${p.id}`}>
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-semibold tabular-nums text-ink-900 dark:text-white" data-testid={`preventivo-numero-${p.id}`}>{p.numero}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-ink-600">{new Date(`${p.data}T00:00:00`).toLocaleDateString('it-IT')}</td>
                  <td className="px-6 py-3 text-sm text-ink-900 dark:text-gray-100">{nomeCliente(p.cliente)}</td>
                  <td className="max-w-xs truncate px-6 py-3 text-sm text-ink-600">{[p.indirizzo_immobile, p.citta_immobile].filter((x) => x?.trim()).join(', ') || '-'}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-semibold tabular-nums text-ink-900 dark:text-white">{euro(calcolaTotali(p).totale)}</td>
                  <td className="px-6 py-3">
                    <StatoPreventivoStepper valore={p.stato} onChange={(s) => cambiaStato(p, s)} testId={`preventivo-stato-${p.id}`} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {[
                        { azione: () => setAperto(p), label: 'Modifica', Icona: Pencil, id: 'modifica', icona: true, stile: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
                        { azione: () => esportaPreventivoPdf(p, true), label: 'PDF con firma digitale', Icona: FileCheck, id: 'pdf-firmato', icona: true, stile: 'border-gray-300 text-gray-800 hover:bg-gray-100' },
                        { azione: () => esportaPreventivoPdf(p, false), label: 'PDF da firmare a mano', Icona: Printer, id: 'pdf-da-firmare', icona: true, stile: 'border-gray-300 text-gray-800 hover:bg-gray-100' },
                        { azione: () => nuovo(p), label: 'Duplica', Icona: CopyPlus, id: 'duplica', icona: true, stile: 'border-gray-300 text-gray-800 hover:bg-gray-100' },
                        { azione: () => elimina(p), label: 'Elimina', Icona: Trash2, id: 'elimina', icona: true, stile: 'border-red-200 text-red-600 hover:bg-red-50' },
                      ].map(({ azione, label, Icona, id, icona, stile }) => (
                        <button key={id} onClick={azione} title={label} aria-label={label} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border bg-white px-2.5 py-1.5 text-xs font-semibold transition-colors dark:bg-gray-800 ${stile}`} data-testid={`preventivo-${id}-${p.id}`}>
                          <Icona className="h-4 w-4" /> {!icona && label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {aperto && <PreventivoForm iniziale={aperto} onClose={() => setAperto(null)} onSaved={() => { setAperto(null); ricarica(); }} />}
    </div>
  );
};
