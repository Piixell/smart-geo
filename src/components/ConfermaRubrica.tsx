import { richiediIdUtente } from '../services/utente';
import { useState } from 'react';
import { BookUser } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { ContattiValori, RubricaFlags } from './ContattiPratica';

type Mancante = { n: 1 | 2; nome: string };
type Richiesta = { mancanti: Mancante[]; flags: RubricaFlags; resolve: (f: RubricaFlags | null) => void };

const chiave = (n: 1 | 2) => (n === 1 ? 'p1' : 'p2');

const nonInRubrica = async (nome: string) => {
  const userId = await richiediIdUtente();
  const { data, error } = await supabase.from('rubrica').select('nominativo').eq('user_id', userId);
  if (error) throw error;
  return !(data || []).some((r) => r.nominativo?.trim().toLowerCase() === nome.trim().toLowerCase());
};

// Avvisa se un proprietario compilato non \u00e8 in rubrica e la casella non \u00e8 spuntata
export const useConfermaRubrica = () => {
  const [richiesta, setRichiesta] = useState<Richiesta | null>(null);
  const [scelte, setScelte] = useState<RubricaFlags>({ p1: true, p2: true });

  const chiedi = async (v: Pick<ContattiValori, 'proprieta' | 'proprieta2'>, flags: RubricaFlags): Promise<RubricaFlags | null> => {
    const candidati: Mancante[] = ([[1, v.proprieta], [2, v.proprieta2]] as [1 | 2, string][])
      .map(([n, nome]) => ({ n, nome: (nome || '').trim() }))
      .filter((c) => c.nome && !flags[chiave(c.n)]);
    const mancanti: Mancante[] = [];
    for (const c of candidati) {
      if (await nonInRubrica(c.nome)) mancanti.push(c);
    }
    if (mancanti.length === 0) return flags;
    return new Promise((resolve) => {
      setScelte({ p1: true, p2: true });
      setRichiesta({ mancanti, flags, resolve });
    });
  };

  const chiudi = (risultato: RubricaFlags | null) => {
    richiesta?.resolve(risultato);
    setRichiesta(null);
  };

  const conferma = () => {
    if (!richiesta) return;
    const finali = { ...richiesta.flags };
    richiesta.mancanti.forEach((m) => { finali[chiave(m.n)] = scelte[chiave(m.n)]; });
    chiudi(finali);
  };

  const dialog = richiesta && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" data-testid="conferma-rubrica-dialog">
      <div className="w-full max-w-md rounded-xl bg-white  border border-ink-200 shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center">
            <BookUser className="w-5 h-5 text-ink-700" />
          </div>
          <h3 className="text-lg font-bold text-ink-700">Aggiungere in rubrica?</h3>
        </div>
        <p className="text-sm text-ink-600">
          {richiesta.mancanti.length === 1 ? 'Questo contatto non \u00e8' : 'Questi contatti non sono'} in rubrica e non hai spuntato la casella. Scegli cosa aggiungere:
        </p>
        <div className="space-y-2">
          {richiesta.mancanti.map((m) => (
            <label key={m.n} className="flex items-center gap-3 rounded-md border border-ink-200 px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scelte[chiave(m.n)]}
                onChange={(e) => setScelte((s) => ({ ...s, [chiave(m.n)]: e.target.checked }))}
                className="w-4 h-4 accent-ink-800"
                data-testid={`conferma-rubrica-${m.n}-checkbox`}
              />
              <span className="text-sm text-ink-700">
                <span className="text-ink-500">Proprietario {m.n}:</span> <strong>{m.nome}</strong>
              </span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button type="button" onClick={() => chiudi(null)} className="btn btn-ghost" data-testid="conferma-rubrica-annulla">
            Torna alla pratica
          </button>
          <button type="button" onClick={conferma} className="btn btn-primary" data-testid="conferma-rubrica-salva">
            Salva pratica
          </button>
        </div>
      </div>
    </div>
  );

  return { chiedi, dialog };
};
