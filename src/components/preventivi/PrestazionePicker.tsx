import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Landmark, Layers, Plus } from 'lucide-react';
import type { Prestazione } from '../PrestazioniSection';

const COMUNE = /\b(CILA|SCIA|PDC|SCA|CLP)\b|permesso di costruire|compatibilit[aà] paesaggistica|condono edilizio/i;
export const gruppoPrestazione = (descrizione: string) => (COMUNE.test(descrizione.replace(/\./g, '')) ? 'comune' : 'varie');

const euro = (v: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v);

interface Props {
  prestazioni: Prestazione[];
  onScegli: (p: Prestazione) => void;
}

export const PrestazionePicker: React.FC<Props> = ({ prestazioni, onScegli }) => {
  const [aperto, setAperto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chiudi = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAperto(false);
    };
    document.addEventListener('mousedown', chiudi);
    return () => document.removeEventListener('mousedown', chiudi);
  }, []);

  const gruppi = [
    { id: 'comune', titolo: 'Comune', Icona: Landmark },
    { id: 'varie', titolo: 'Varie', Icona: Layers },
  ];

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setAperto((a) => !a)} className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700" data-testid="preventivo-aggiungi-prestazione">
        <Plus className="h-3.5 w-3.5" /> Aggiungi prestazione <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aperto ? 'rotate-180' : ''}`} />
      </button>
      {aperto && (
        <div className="absolute left-0 z-30 sm:left-auto sm:right-0 mt-2 grid w-[min(640px,90vw)] grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:grid-cols-2 dark:border-gray-700 dark:bg-gray-800" data-testid="preventivo-prestazioni-menu">
          {gruppi.map(({ id, titolo, Icona }) => (
            <div key={id} data-testid={`preventivo-gruppo-${id}`}>
              <h4 className="mb-2 flex items-center gap-1.5 border-b border-gray-200 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-700"><Icona className="h-3.5 w-3.5" /> {titolo}</h4>
              <ul className="space-y-0.5">
                {prestazioni.filter((p) => gruppoPrestazione(p.descrizione) === id).map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => { onScegli(p); setAperto(false); }} className="flex w-full items-start justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700" data-testid={`preventivo-prestazione-${p.id}`}>
                      <span className="leading-snug">{p.descrizione}</span>
                      <span className="shrink-0 text-xs tabular-nums text-gray-500">{euro(Number(p.onorario))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
