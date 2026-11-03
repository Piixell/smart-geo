import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FiltroDashboard { stato: string; incassare: boolean; nuovo: boolean }

const CHIAVI = ['stato', 'incassare', 'nuovo'];

// Vero se si arriva dalla dashboard con un filtro: il caricamento iniziale senza filtri va saltato
export const filtroDashboardInUrl = () => {
  const p = new URLSearchParams(window.location.search);
  return p.has('stato') || p.has('incassare');
};

// Applica ?stato=<id>, ?incassare=1 o ?nuovo=1 arrivando dalla dashboard, poi li toglie dall'indirizzo
export const useFiltroDashboard = (pronto: boolean, applica: (f: FiltroDashboard) => void) => {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (!pronto || !CHIAVI.some((k) => params.has(k))) {
      return;
    }
    applica({ stato: params.get('stato') || '', incassare: params.has('incassare'), nuovo: params.has('nuovo') });
    const resto = new URLSearchParams(params);
    CHIAVI.forEach((k) => resto.delete(k));
    setParams(resto, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, params]);
};
