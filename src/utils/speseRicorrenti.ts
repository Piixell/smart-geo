import { supabase } from '../services/supabase';

type SpesaBase = { descrizione?: string | null; data_scadenza?: string | null; created_at?: string | null };

// Anno in cui la spesa va pagata
export const annoSpesa = (s: SpesaBase) => {
  if (s.data_scadenza) return Number(s.data_scadenza.slice(0, 4));
  const m = /^[12]° acconto tasse maturate nell'anno (\d{4})$/.exec(s.descrizione || '');
  if (m) return Number(m[1]);
  return s.created_at ? Number(s.created_at.slice(0, 4)) : new Date().getFullYear();
};

const sincronizzazioni = new Map<string, Promise<void>>();

// La transazione SQL impedisce copie duplicate anche tra schede o dispositivi.
export const riproponiCostiFissi = (userId: string): Promise<void> => {
  const esistente = sincronizzazioni.get(userId);
  if (esistente) return esistente;
  const promessa = (async () => {
    const { error } = await supabase.rpc('riproponi_costi_fissi', { p_user_id: userId });
    if (error) throw error;
  })().finally(() => { sincronizzazioni.delete(userId); });
  sincronizzazioni.set(userId, promessa);
  return promessa;
};
