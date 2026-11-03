import { Check, X } from 'lucide-react';

export type StatoPagamento = 0 | 1 | 2;

export const statoPagamento = (acconto?: boolean, saldo?: boolean): StatoPagamento => (saldo ? 2 : acconto ? 1 : 0);

const ETICHETTE = ['Da pagare', 'Acconto versato', 'Saldato'];
const PROSSIMO = ['clic per segnare l\'acconto', 'clic per segnare il saldo', 'clic per azzerare'];

interface PagamentoToggleProps {
  stato: StatoPagamento;
  omaggio?: boolean;
  onClick: () => void;
  testId: string;
}

// Stesso aspetto dei flag: grigio con X, met\u00e0 verde (acconto), verde con spunta (saldo)
const SFONDI = [
  'bg-ink-100 hover:bg-ink-200 border-[1.5px] border-ink-400',
  'bg-[linear-gradient(90deg,#CCFBF1_50%,#F1F5F9_50%)] border-[1.5px] border-topo-500',
  'bg-topo-100 hover:bg-topo-200 border-[1.5px] border-topo-500',
];

export const PagamentoToggle = ({ stato, omaggio, onClick, testId }: PagamentoToggleProps) => {
  if (omaggio) {
    return (
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400" title="Pratica in omaggio: nessun pagamento" data-testid={testId}>
        Omaggio
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center overflow-hidden w-8 h-8 rounded-full transition-all duration-150 hover:scale-105 cursor-pointer ${SFONDI[stato]}`}
      title={`${ETICHETTE[stato]} \u2014 ${PROSSIMO[stato]}`}
      aria-label={ETICHETTE[stato]}
      data-testid={testId}
      data-stato={stato}
    >
      {stato === 0 && <X className="w-4 h-4 text-ink-500" strokeWidth={2} />}
      {stato === 1 && <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-topo-500" aria-hidden="true" />}
      {stato === 2 && <Check className="w-4 h-4 text-topo-600" strokeWidth={2.5} />}
    </button>
  );
};
