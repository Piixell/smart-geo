import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import type { AuthUser, AuthState } from '../types';
import toast from 'react-hot-toast';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthStore extends AuthState {
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  initialize: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Funzione helper per creare/recuperare il profilo utente con timeout
const getUserProfile = async (session: Session): Promise<AuthUser | null> => {
  if (!session.user.email) {
    return null;
  }

  try {
    // Timeout per evitare blocchi infiniti
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout recupero profilo')), 5000)
    );

    // Query per recuperare il profilo
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const { data: profile, error: profileError } = await Promise.race([
      profilePromise,
      timeoutPromise
    ]) as any;

    // Se il profilo non esiste, crealo
    if (profileError && profileError.code === 'PGRST116') {
      const username = session.user.email.split('@')[0];
      
      // Fallback: se non riusciamo a creare il profilo, restituiamo comunque l'utente
      try {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            username
          });

        if (insertError) {
          console.error('Errore nella creazione del profilo:', insertError);
        }
      } catch (insertErr) {
        console.error('Errore critico nella creazione profilo:', insertErr);
      }

      return {
        id: session.user.id,
        email: session.user.email,
        username
      };
    }

    if (profileError) {
      console.error('Errore nel recupero del profilo:', profileError);
      // Fallback: usa i dati della sessione
      return {
        id: session.user.id,
        email: session.user.email,
        username: session.user.email.split('@')[0]
      };
    }

    return {
      id: session.user.id,
      email: session.user.email,
      username: profile?.username || session.user.email.split('@')[0]
    };
  } catch (error) {
    console.error('Errore nel getUserProfile:', error);
    // Fallback finale: usa solo i dati della sessione
    return {
      id: session.user.id,
      email: session.user.email,
      username: session.user.email.split('@')[0]
    };
  }
};

// Variabile globale per tenere traccia del listener
let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      error: null,

      setUser: (user) => set({ user, error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      initialize: async () => {
        try {
          set({ loading: true, error: null });
          
          // Cleanup del listener precedente se esiste
          if (authListener) {
            authListener.data.subscription.unsubscribe();
            authListener = null;
          }
          
          // Recupera la sessione corrente da Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Errore nel recupero della sessione:', error);
            set({ user: null, loading: false });
            return;
          }

          if (session?.user) {
            const userProfile = await getUserProfile(session);
            set({ user: userProfile, loading: false });
          } else {
            set({ user: null, loading: false });
          }

          // Configura il listener per i cambiamenti di autenticazione
          authListener = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
              switch (event) {
                case 'SIGNED_IN':
                  if (session?.user) {
                    // Gestisci il recupero profilo in modo non bloccante
                    (async () => {
                      try {
                        const userProfile = await getUserProfile(session);
                        set((state) => ({ 
                          ...state, 
                          user: userProfile, 
                          loading: false 
                        }));
                      } catch (error) {
                        console.error('Errore nell\'elaborazione SIGNED_IN:', error);
                        // Fallback: usa solo i dati della sessione
                        set((state) => ({ 
                          ...state, 
                          user: {
                            id: session.user.id,
                            email: session.user.email!,
                            username: session.user.email!.split('@')[0]
                          }, 
                          loading: false 
                        }));
                      }
                    })();
                  }
                  break;
                  
                case 'SIGNED_OUT':
                  set((state) => ({ 
                    ...state, 
                    user: null, 
                    loading: false 
                  }));
                  break;
                  
                case 'TOKEN_REFRESHED':
                  if (session?.user) {
                    const currentUser = get().user;
                    if (!currentUser) {
                      const userProfile = await getUserProfile(session);
                      set((state) => ({ 
                        ...state, 
                        user: userProfile 
                      }));
                    }
                  }
                  break;
                  
                default:
                  break;
              }
            }
          );
        } catch (error) {
          console.error('Errore nell\'inizializzazione:', error);
          set({ user: null, loading: false, error: 'Errore di inizializzazione' });
        }
      },

      signIn: async (email, password, rememberMe = false) => {
        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            set({ error: error.message, loading: false });
            toast.error('Errore durante il login: ' + error.message);
            return false;
          }

          if (data.session?.user) {
            // Salva la preferenza "ricordami"
            if (rememberMe) {
              localStorage.setItem('smart-geo-remember-me', 'true');
            } else {
              localStorage.removeItem('smart-geo-remember-me');
            }

            const userProfile = await getUserProfile(data.session);
            set({ user: userProfile, loading: false });
            toast.success('Login effettuato con successo!');
            return true;
          }

          set({ loading: false });
          return false;
        } catch (error: any) {
          console.error('Errore nel signIn:', error);
          set({ error: error.message || 'Errore imprevisto', loading: false });
          toast.error('Errore imprevisto durante il login');
          return false;
        }
      },

      signUp: async (email, password, username) => {
        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username
              }
            }
          });

          if (error) {
            set({ error: error.message, loading: false });
            toast.error('Errore durante la registrazione: ' + error.message);
            return false;
          }

          if (data.user) {
            // Se l'utente è già confermato, crea subito il profilo
            if (data.session) {
              await getUserProfile(data.session);
            }
            
            toast.success('Registrazione completata! Controlla la tua email per confermare l\'account.');
            set({ loading: false });
            return true;
          }

          set({ loading: false });
          return false;
        } catch (error: any) {
          console.error('Errore nel signUp:', error);
          set({ error: error.message || 'Errore imprevisto', loading: false });
          toast.error('Errore imprevisto durante la registrazione');
          return false;
        }
      },

      signOut: async () => {
        try {
          set({ loading: true });
          
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error('Errore durante il logout:', error);
            toast.error('Errore durante il logout');
            set({ loading: false });
          } else {
            // Pulisci lo stato e i dati persistiti
            set({ user: null, loading: false });
            localStorage.removeItem('smart-geo-remember-me');
            toast.success('Logout effettuato con successo!');
          }
        } catch (error) {
          console.error('Errore imprevisto durante il logout:', error);
          toast.error('Errore imprevisto durante il logout');
          set({ loading: false });
        }
      },

      resetPassword: async (email) => {
        try {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`
          });

          if (error) {
            set({ error: error.message, loading: false });
            toast.error('Errore nell\'invio dell\'email: ' + error.message);
            return false;
          }

          toast.success('Email di reset password inviata!');
          set({ loading: false });
          return true;
        } catch (error: any) {
          console.error('Errore nel resetPassword:', error);
          set({ error: error.message || 'Errore imprevisto', loading: false });
          toast.error('Errore imprevisto');
          return false;
        }
      }
    }),
    {
      name: 'smart-geo-auth',
      partialize: (state) => ({ 
        user: state.user
      }),
      // Mantieni i dati solo se l'utente aveva selezionato "ricordami"
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        // Se non c'è il flag "ricordami", pulisci lo stato persistito
        const rememberMe = localStorage.getItem('smart-geo-remember-me');
        if (!rememberMe && state) {
          state.user = null;
        }
      }
    }
  )
);
