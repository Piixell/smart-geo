import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MESI, type PraticaDash, type Sezione } from '../../utils/dashboardData';

export const euro = (n: number, dec = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

export const PERCORSO: Record<Sezione, string> = { comune: '/comune-catasto', varie: '/varie', ape: '/ape' };
const ETICHETTA: Record<Sezione, string> = { comune: 'Comunale/Catastale', varie: 'Varia', ape: 'APE' };

export const Riquadro: React.FC<{ titolo: string; azione?: { label: string; to: string }; children: React.ReactNode; testId: string; className?: string }> = ({ titolo, azione, children, testId, className = '' }) => {
  const navigate = useNavigate();
  return (
    <section className={`card p-0 overflow-hidden ${className}`} data-testid={testId}>
      <header className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5 dark:border-gray-700">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-600 dark:text-gray-300">{titolo}</h2>
        {azione && (
          <button onClick={() => navigate(azione.to)} className="inline-flex items-center gap-1 text-xs font-semibold text-signal-600 hover:underline" data-testid={`${testId}-azione`}>
            {azione.label} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </header>
      {children}
    </section>
  );
};

export const Kpi: React.FC<{ label: string; valore: string | number; nota?: string; dettaglio?: { label: string; valore: string | number; to?: string }[]; to: string; accento: string; testId: string }> = ({ label, valore, nota, dettaglio, to, accento, testId }) => {
  const navigate = useNavigate();
  return (
    <div className="card group text-left transition-shadow hover:shadow-md" data-testid={testId}>
      <button onClick={() => navigate(to)} className="block w-full text-left" data-testid={`${testId}-apri`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accento}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</span>
        </div>
        <div className="mt-3 text-3xl font-bold tabular-nums text-ink-900 dark:text-white">{valore}</div>
      </button>
      {dettaglio && (
        <dl className="mt-3 space-y-1 border-t border-ink-100 pt-3 dark:border-gray-700">
          {dettaglio.map((d) => {
            const id = `${testId}-${d.label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
            return (
              <div key={d.label} className="flex items-center justify-between text-xs" data-testid={id}>
                <dt>
                  {d.to ? (
                    <button onClick={() => navigate(d.to!)} className="text-left text-ink-600 underline decoration-ink-300 underline-offset-2 transition-colors hover:text-ink-900 hover:decoration-ink-700 dark:text-gray-300" data-testid={`${id}-link`}>{d.label}</button>
                  ) : <span className="text-ink-500">{d.label}</span>}
                </dt>
                <dd className="font-semibold tabular-nums text-ink-800 dark:text-gray-200">{d.valore}</dd>
              </div>
            );
          })}
        </dl>
      )}
      {nota && (
      <div className="mt-1 flex items-center justify-between text-xs text-ink-500">
        {nota}
        <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      )}
    </div>
  );
};

export const GraficoMesi: React.FC<{ anno: number[]; precedente: number[]; annoCorrente: number }> = ({ anno, precedente, annoCorrente }) => {
  const max = Math.max(1, ...anno, ...precedente);
  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-signal-500" />{annoCorrente}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ink-200 dark:bg-gray-600" />{annoCorrente - 1}</span>
      </div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-3">
        {MESI.map((m, i) => (
          <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${m}: ${euro(anno[i])} (${annoCorrente - 1}: ${euro(precedente[i])})`} data-testid={`grafico-mese-${i + 1}`}>
            <div className="flex h-full w-full items-end justify-center gap-0.5">
              <div className="w-1/2 rounded-t bg-ink-200 dark:bg-gray-600" style={{ height: `${(precedente[i] / max) * 100}%` }} />
              <div className="w-1/2 rounded-t bg-signal-500 transition-all" style={{ height: `${(anno[i] / max) * 100}%` }} />
            </div>
            <span className="text-[10px] font-medium uppercase text-ink-500">{m.slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ElencoPratiche: React.FC<{ pratiche: PraticaDash[]; vuoto: string; testId: string; mostraPagamento?: boolean }> = ({ pratiche, vuoto, testId, mostraPagamento }) => {
  const navigate = useNavigate();
  if (pratiche.length === 0) return <p className="px-5 py-6 text-sm text-ink-500">{vuoto}</p>;
  return (
    <ul className="divide-y divide-ink-100 dark:divide-gray-700">
      {pratiche.map((p) => (
        <li key={`${p.sezione}-${p.id}`}>
          <button onClick={() => navigate(PERCORSO[p.sezione])} className="flex w-full items-center justify-between gap-3 px-5 py-2.5 text-left hover:bg-ink-50 dark:hover:bg-gray-700/50" data-testid={`${testId}-${p.sezione}-${p.id}`}>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">{p.proprieta} · {p.committente}</span>
              <span className="block truncate text-xs text-ink-500">{p.indirizzo}{p.citta ? `, ${p.citta}` : ''}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600 dark:bg-gray-700 dark:text-gray-300">{ETICHETTA[p.sezione]}</span>
              <span className="text-[11px] text-ink-500">{mostraPagamento ? (p.acconto ? 'Acconto versato' : 'Nessun pagamento') : p.stato}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};

export const RigaFiscale: React.FC<{ label: string; valore: number; forte?: boolean; testId: string }> = ({ label, valore, forte, testId }) => (
  <div className={`flex items-center justify-between px-5 py-2.5 text-sm ${forte ? 'bg-ink-50 font-bold text-ink-900 dark:bg-gray-700/50 dark:text-white' : 'text-ink-700 dark:text-gray-300'}`} data-testid={testId}>
    <span>{label}</span>
    <span className="tabular-nums">{euro(valore, 2)}</span>
  </div>
);
