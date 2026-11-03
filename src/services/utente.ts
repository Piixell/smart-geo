import { supabase } from './supabase';

// Il server verifica il token e applica RLS; il filtro esplicito limita ogni query.
export const richiediIdUtente = async (): Promise<string> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user.id) throw new Error('Accedi per continuare');
  return session.user.id;
};
