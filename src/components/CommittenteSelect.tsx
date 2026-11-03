import { richiediIdUtente } from '../services/utente';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { supabase } from '../services/supabase';
import { cercaSuMappa, conCivico, type SuggerimentoMappa } from '../services/mappe';

const TABELLE = ['varie', 'ape', 'comune_catasto'] as const;

export const caricaNascosti = async () => {
  const userId = await richiediIdUtente();
  const { data, error } = await supabase.from('committenti_nascosti').select('nome').eq('user_id', userId);
  if (error) throw error;
  return new Set((data || []).map((r) => r.nome.trim().toLowerCase()));
};

type Campo = 'committente' | 'citta' | 'indirizzo' | 'nominativo';

const caricaValori = async (campo: Campo) => {
  const userId = await richiediIdUtente();
  if (campo === 'nominativo') {
    const { data } = await supabase.from('rubrica').select('nominativo').eq('user_id', userId).limit(10000);
    const nomi = new Map((data || []).map((r) => [(r.nominativo || '').trim().toLowerCase(), (r.nominativo || '').trim()]));
    return [...nomi.values()].filter(Boolean).sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }
  const [risultati, esclusi] = await Promise.all([
    Promise.all(TABELLE.map((t) => supabase.from(t).select(campo).eq('user_id', userId).not(campo, 'is', null).limit(10000))),
    campo === 'committente' ? caricaNascosti() : Promise.resolve(new Set<string>()),
  ]);
  const mappa = new Map<string, string>();
  risultati.forEach(({ data }) =>
    (data || []).forEach((r: Record<string, string | null>) => {
      const nome = (r[campo] || '').trim();
      if (/[a-z0-9]/i.test(nome) && !esclusi.has(nome.toLowerCase()) && !mappa.has(nome.toLowerCase())) mappa.set(nome.toLowerCase(), nome);
    })
  );
  return [...mappa.values()].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base', numeric: true }));
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  testId: string;
  placeholder?: string;
  campo?: Campo;
  onCitta?: (citta: string) => void;
  onScelta?: (s: SuggerimentoMappa) => void;
  obbligatorio?: boolean;
  maiuscolo?: boolean;
}

// Per indirizzo e città aggiunge i suggerimenti della mappa (prima quelli vicini a Torino)
const useMappa = (campo: Campo, testo: string, attivo: boolean) => {
  const [risultati, setRisultati] = useState<SuggerimentoMappa[]>([]);
  useEffect(() => {
    if (!attivo || (campo !== 'indirizzo' && campo !== 'citta') || testo.trim().length < 3) {
      setRisultati([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      cercaSuMappa(testo, campo, ctrl.signal).then(setRisultati).catch(() => {});
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [campo, testo, attivo]);
  return risultati;
};

export const CommittenteSelect: React.FC<Props> = ({ value, onChange, testId, placeholder = 'Nome committente', campo = 'committente', onCitta, onScelta, obbligatorio = true, maiuscolo = false }) => {
  const [opzioni, setOpzioni] = useState<string[]>([]);
  const [aperto, setAperto] = useState(false);
  const [filtro, setFiltro] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    caricaValori(campo).then(setOpzioni).catch(() => setOpzioni([]));
  }, [campo]);

  useEffect(() => {
    const chiudi = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setAperto(false);
    };
    document.addEventListener('mousedown', chiudi);
    return () => document.removeEventListener('mousedown', chiudi);
  }, []);

  const visibili = filtro ? opzioni.filter((o) => o.toLowerCase().includes(filtro.toLowerCase())).slice(0, filtro.length >= 3 && (campo === 'indirizzo' || campo === 'citta') ? 5 : undefined) : opzioni;
  const mappa = useMappa(campo, filtro, aperto);
  const scegliMappa = (s: SuggerimentoMappa) => {
    const v = campo === 'indirizzo' ? conCivico(filtro, s.nome) : s.nome;
    onChange(maiuscolo ? v.toUpperCase() : v);
    if (campo === 'indirizzo' && s.citta) onCitta?.(s.citta);
    onScelta?.(s);
    setAperto(false);
  };

  return (
    <div className="relative" ref={box}>
      <input
        type="text"
        required={obbligatorio}
        value={value}
        onChange={(e) => { onChange(maiuscolo ? e.target.value.toUpperCase() : e.target.value); setFiltro(e.target.value); setAperto(true); }}
        onFocus={() => { setFiltro(''); setAperto(true); }}
        placeholder={placeholder}
        className={`input w-full pr-9 ${maiuscolo ? 'uppercase' : ''}`}
        autoComplete="off"
        data-testid={testId}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => { setFiltro(''); setAperto((a) => !a); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        data-testid={`${testId}-toggle`}
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${aperto ? 'rotate-180' : ''}`} />
      </button>
      {aperto && (visibili.length > 0 || mappa.length > 0) && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800" data-testid={`${testId}-lista`}>
          {mappa.length > 0 && (
            <>
              <li className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Dalla mappa</li>
              {mappa.map((s, i) => (
                <li key={`m-${s.nome}-${s.citta}`}>
                  <button type="button" onClick={() => scegliMappa(s)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700" data-testid={`${testId}-mappa-${i}`}>
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    <span className="truncate">{s.nome}</span>
                    <span className="ml-auto shrink-0 text-xs text-ink-400">{campo === 'indirizzo' ? s.citta : s.provincia}</span>
                  </button>
                </li>
              ))}
              {visibili.length > 0 && <li className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Già usati</li>}
            </>
          )}
          {visibili.map((o) => (
            <li key={o}>
              <button
                type="button"
                onClick={() => { onChange(maiuscolo ? o.toUpperCase() : o); setAperto(false); }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${o === value ? 'font-semibold' : ''}`}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
