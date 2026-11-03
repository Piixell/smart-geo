import React from 'react';
import { Check, PencilLine, Send, X } from 'lucide-react';
import type { StatoPreventivo } from '../../utils/preventivi';

const PASSI: { id: StatoPreventivo; label: string; Icona: typeof Check; attivo: string }[] = [
  { id: 'bozza', label: 'Bozza', Icona: PencilLine, attivo: 'bg-white text-ink-800 shadow-sm ring-1 ring-ink-300 dark:bg-gray-600 dark:text-white' },
  { id: 'inviato', label: 'Inviato', Icona: Send, attivo: 'bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-300 dark:bg-blue-900/40 dark:text-blue-200' },
  { id: 'accettato', label: 'Accettato', Icona: Check, attivo: 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200' },
  { id: 'rifiutato', label: 'Rifiutato', Icona: X, attivo: 'bg-red-50 text-red-700 shadow-sm ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-200' },
];

interface Props {
  valore: StatoPreventivo;
  onChange: (v: StatoPreventivo) => void;
  testId: string;
}

export const StatoPreventivoStepper: React.FC<Props> = ({ valore, onChange, testId }) => (
  <div className="inline-flex items-center gap-0.5 rounded-lg bg-ink-100 p-0.5 dark:bg-gray-700" role="radiogroup" data-testid={testId}>
    {PASSI.map(({ id, label, Icona, attivo }) => {
      const selezionato = valore === id;
      return (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={selezionato}
          onClick={() => !selezionato && onChange(id)}
          data-testid={`${testId}-${id}`}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
            selezionato ? attivo : 'text-ink-500 hover:bg-white/60 hover:text-ink-800 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Icona className="h-3.5 w-3.5" strokeWidth={id === 'accettato' ? 3 : 2} />
          {label}
        </button>
      );
    })}
  </div>
);
