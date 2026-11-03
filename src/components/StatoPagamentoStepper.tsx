import React from 'react';
import { Check, Circle, Wallet } from 'lucide-react';

export type StatoPagamento = 'da_pagare' | 'pronta' | 'pagata';

export const statoPagamentoDi = (s: { pagamento: boolean; pagamento_pronto: boolean }): StatoPagamento =>
  s.pagamento ? 'pagata' : s.pagamento_pronto ? 'pronta' : 'da_pagare';

const PASSI: { id: StatoPagamento; label: string; titolo: string; Icona: typeof Check; attivo: string }[] = [
  { id: 'da_pagare', label: 'Da pagare', titolo: 'Spesa da sostenere', Icona: Circle, attivo: 'bg-white text-ink-800 shadow-sm ring-1 ring-ink-300 dark:bg-gray-600 dark:text-white' },
  { id: 'pronta', label: 'Pronta', titolo: 'Fondi disponibili: pronta per essere pagata', Icona: Wallet, attivo: 'bg-amber-50 text-amber-800 shadow-sm ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-200' },
  { id: 'pagata', label: 'Pagata', titolo: 'Pagamento effettuato', Icona: Check, attivo: 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200' },
];

interface Props {
  valore: StatoPagamento;
  onChange: (v: StatoPagamento) => void;
  testId: string;
}

export const StatoPagamentoStepper: React.FC<Props> = ({ valore, onChange, testId }) => (
  <div className="inline-flex items-center gap-0.5 rounded-lg bg-ink-100 p-0.5 dark:bg-gray-700" role="radiogroup" data-testid={testId}>
    {PASSI.map(({ id, label, titolo, Icona, attivo }) => {
      const selezionato = valore === id;
      return (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={selezionato}
          title={titolo}
          onClick={() => !selezionato && onChange(id)}
          data-testid={`${testId}-${id}`}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
            selezionato ? attivo : 'text-ink-500 hover:text-ink-800 hover:bg-white/60 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Icona className="h-3.5 w-3.5" strokeWidth={id === 'pagata' ? 3 : 2} />
          {label}
        </button>
      );
    })}
  </div>
);
