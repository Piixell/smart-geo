import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Scadenza } from '../types';
import { cfg } from '../services/impostazioni';

const giorni = () => cfg().pagine.giorniAvvisoSpese;
const giorniMancanti = (data: string) => {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${data}T00:00:00`).getTime() - oggi.getTime()) / 86400000);
};
const etichetta = (g: number) => (g < 0 ? `Scaduta da ${-g} ${-g === 1 ? 'giorno' : 'giorni'}` : g === 0 ? 'Scade oggi' : `Tra ${g} ${g === 1 ? 'giorno' : 'giorni'}`);
const euro = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

export const AvvisoScadenzeSpese: React.FC<{ userId?: string }> = ({ userId }) => {
  const [spese, setSpese] = useState<Scadenza[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    const limite = new Date(Date.now() + giorni() * 86400000).toISOString().split('T')[0];
    supabase
      .from('scadenze')
      .select('*')
      .eq('user_id', userId)
      .eq('pagamento', false)
      .not('data_scadenza', 'is', null)
      .lte('data_scadenza', limite)
      .order('data_scadenza', { ascending: true })
      .then(({ data }) => setSpese(data || []));
  }, [userId]);

  if (spese.length === 0) return null;
  const totale = spese.reduce((t, s) => t + Number(s.spese), 0);

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20" data-testid="avviso-scadenze-spese">
      <div className="flex items-center justify-between gap-4 border-b border-amber-200 px-5 py-3 dark:border-amber-800">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-semibold">
            {spese.length} {spese.length === 1 ? 'spesa da pagare' : 'spese da pagare'} entro {giorni()} giorni · {euro(totale)}
          </span>
        </div>
        <button onClick={() => navigate('/spese')} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline dark:text-amber-200" data-testid="avviso-scadenze-vai-spese">
          Vai a Spese <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="divide-y divide-amber-200 dark:divide-amber-800">
        {spese.map((s) => {
          const g = giorniMancanti(s.data_scadenza!);
          return (
            <li key={s.id} className="flex flex-col gap-1 px-5 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4" data-testid={`avviso-scadenza-${s.id}`}>
              <span className="text-ink-800 dark:text-gray-100">
                {s.descrizione}
                {s.pagamento_pronto && <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 ring-1 ring-amber-300">Pronta</span>}
              </span>
              <span className="flex items-center justify-between gap-4 sm:shrink-0">
                <span className={`text-xs font-medium ${g < 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-800 dark:text-amber-300'}`}>
                  {etichetta(g)} · {new Date(`${s.data_scadenza}T00:00:00`).toLocaleDateString('it-IT')}
                </span>
                <span className="text-right font-semibold sm:w-24 text-ink-900 dark:text-white">{euro(Number(s.spese))}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
