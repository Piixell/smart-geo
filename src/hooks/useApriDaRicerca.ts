import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

// Apre il record indicato da ?apri=<id> (arrivo dalla ricerca generale)
export const useApriDaRicerca = <T,>(tabella: string, apri: (record: T) => void) => {
  const [params, setParams] = useSearchParams();
  const id = params.get('apri');
  const userId = useAuthStore((stato) => stato.user?.id);

  useEffect(() => {
    if (!id || !userId || !/^\d+$/.test(id)) {
      return;
    }
    let attivo = true;
    supabase.from(tabella).select('*').eq('id', id).eq('user_id', userId).maybeSingle().then(({ data }) => {
      if (!attivo) return;
      if (data) apri(data as T);
      const resto = new URLSearchParams(params);
      resto.delete('apri');
      setParams(resto, { replace: true });
    });
    return () => { attivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tabella, userId]);
};
