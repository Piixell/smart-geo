import React from 'react';
import { Plus, Trash2, EyeOff } from 'lucide-react';
import { CATEGORIE_SPESE, type CategoriaSpesaInterna, type SpesaInterna } from '../../utils/preventivi';
import { ImportoInput } from './ImportoInput';
import { useImpostazioni } from '../../services/impostazioni';
import { aliquotaTasse } from '../../utils/aliquotaTasse';

const euro = (v: number) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

interface Props {
  righe: SpesaInterna[];
  onChange: (r: SpesaInterna[]) => void;
  perCategoria: Record<CategoriaSpesaInterna, number>;
  tasse: number;
  speseEsatte: number;
  spese: number;
}

// Calcolo spese ad uso interno: nel PDF compare solo il totale come "Spese anticipate per Vs conto"
export const SpeseInterne: React.FC<Props> = ({ righe, onChange, perCategoria, tasse, speseEsatte, spese }) => {
  const { coefficiente } = useImpostazioni().fisco;
  const aggiorna = (i: number, campo: 'descrizione' | 'importo', valore: string) =>
    onChange(righe.map((r, k) => (k === i ? { ...r, [campo]: campo === 'importo' ? parseFloat(valore) || 0 : valore } : r)));

  const colonna = (titolo: string, testId: string, contenuto: React.ReactNode, totale: number, azione?: () => void) => (
    <div className="flex min-w-0 flex-col rounded-lg border border-amber-300 bg-white dark:bg-gray-800" data-testid={testId}>
      <div className="flex items-center justify-between border-b border-amber-200 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">{titolo}</span>
        {azione && <button type="button" onClick={azione} className="text-amber-700 hover:text-amber-900" title="Aggiungi voce" data-testid={`${testId}-aggiungi`}><Plus className="h-4 w-4" /></button>}
      </div>
      <div className="flex-1 space-y-1.5 p-2">{contenuto}</div>
      <div className="border-t border-amber-200 px-3 py-1.5 text-right text-sm font-bold tabular-nums text-ink-900 dark:text-white" data-testid={`${testId}-totale`}>{euro(totale)}</div>
    </div>
  );

  return (
    <section className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-700 dark:bg-amber-900/10" data-testid="preventivo-spese-interne">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <EyeOff className="h-4 w-4 text-amber-700" />
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Calcolo spese · uso interno</h3>
        <span className="text-xs text-amber-800/80">Non compare nel PDF: al cliente arriva solo il totale arrotondato</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIE_SPESE.map((c) => <React.Fragment key={c.id}>{colonna(c.label, `spese-${c.id}`, (
          <>
            {righe.map((r, i) => r.categoria !== c.id ? null : (
              <div key={i} className="flex items-center gap-1" data-testid={`spesa-interna-riga-${i}`}>
                <ImportoInput valore={r.importo} onChange={(v) => onChange(righe.map((x, k) => (k === i ? { ...x, importo: v } : x)))} className="input w-20 shrink-0 px-2 py-1 text-right text-sm tabular-nums" testId={`spesa-interna-importo-${i}`} />
                <div className="relative h-8 min-w-0 flex-1">
                  <input value={r.descrizione} onChange={(e) => aggiorna(i, 'descrizione', e.target.value)} placeholder="descrizione" title={r.descrizione} className="input absolute inset-y-0 left-0 h-8 w-full px-2 py-1 text-sm transition-[width,box-shadow] duration-150 focus:z-20 focus:w-72 focus:shadow-lg" data-testid={`spesa-interna-descrizione-${i}`} />
                </div>
                <button type="button" onClick={() => onChange(righe.filter((_, k) => k !== i))} className="text-red-400 hover:text-red-600" title="Rimuovi"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </>
        ), perCategoria[c.id], () => onChange([...righe, { categoria: c.id, descrizione: '', importo: 0 }]))}</React.Fragment>)}
        {colonna('Tasse', 'spese-tasse', <p className="px-1 text-xs text-ink-500">(onorario totale + bolli) × {coefficiente}% × {Math.round(aliquotaTasse(new Date().getFullYear()) * 1000) / 10}%, calcolate in automatico</p>, tasse)}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-x-6 gap-y-1 rounded-lg border-2 border-amber-400 bg-white px-4 py-2 dark:bg-gray-800" data-testid="spese-interne-riepilogo">
        <span className="text-xs text-ink-500">Totale esatto <span className="ml-1 text-sm font-semibold tabular-nums text-red-600" data-testid="spese-interne-totale-esatto">{euro(speseEsatte)}</span></span>
        <span className="text-xs text-ink-500">Nel preventivo <span className="ml-1 text-lg font-bold tabular-nums text-ink-900 dark:text-white" data-testid="spese-interne-totale">{euro(spese)}</span></span>
      </div>
    </section>
  );
};
