import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { VocePreventivo } from '../../utils/preventivi';
import type { Prestazione } from '../PrestazioniSection';
import { RigheEditor } from './RigheEditor';
import { PrestazionePicker } from './PrestazionePicker';

interface Props {
  voci: VocePreventivo[];
  prestazioni: Prestazione[];
  onChange: (v: VocePreventivo[]) => void;
}

export const VociPreventivo: React.FC<Props> = ({ voci, prestazioni, onChange }) => {
  const aggiorna = (i: number, campo: keyof VocePreventivo, valore: string) =>
    onChange(voci.map((v, k) => (k === i ? { ...v, [campo]: campo === 'onorario' ? parseFloat(valore) || 0 : valore } : v)));

  const aggiungiPrestazione = (p: Prestazione) =>
    onChange([...voci, { descrizione: p.descrizione, dettagli: p.dettagli || '', onorario: Number(p.onorario) }]);

  return (
    <section data-testid="preventivo-voci">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-600">Prestazioni</h3>
        <div className="flex flex-wrap gap-2">
          <PrestazionePicker prestazioni={prestazioni} onScegli={aggiungiPrestazione} />
          <button type="button" onClick={() => onChange([...voci, { descrizione: '', dettagli: '', onorario: 0 }])} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50" data-testid="preventivo-aggiungi-voce-libera">
            <Plus className="h-3.5 w-3.5" /> Voce libera
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {voci.length === 0 && <p className="rounded-lg border border-dashed border-ink-200 py-4 text-center text-sm text-ink-500">Scegli una prestazione da "Aggiungi prestazione": l'onorario viene proposto in automatico e puoi modificarlo.</p>}
        {voci.map((v, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-ink-100 p-2 dark:border-gray-700" data-testid={`preventivo-voce-${i}`}>
            <div className="flex-1 space-y-1.5">
              <input value={v.descrizione} onChange={(e) => aggiorna(i, 'descrizione', e.target.value)} placeholder="Titolo prestazione (es. SEGNALAZIONE CERTIFICATA DI INIZIO ATTIVITÀ - S.C.I.A.)" className="input w-full py-1.5 text-sm font-semibold" data-testid={`preventivo-voce-descrizione-${i}`} />
              <RigheEditor value={v.dettagli || ''} onChange={(d) => aggiorna(i, 'dettagli', d)} testId={`preventivo-voce-dettagli-${i}`} />
            </div>
            <div className="relative w-32 shrink-0">
              <input type="number" step="0.01" min="0" value={v.onorario || ''} onChange={(e) => aggiorna(i, 'onorario', e.target.value)} className="input w-full py-1.5 pr-6 text-right text-sm tabular-nums" data-testid={`preventivo-voce-onorario-${i}`} />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-400">€</span>
            </div>
            <button type="button" onClick={() => onChange(voci.filter((_, k) => k !== i))} className="text-red-500 hover:text-red-700" title="Rimuovi" data-testid={`preventivo-voce-rimuovi-${i}`}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </section>
  );
};
