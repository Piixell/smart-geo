import { richiediIdUtente } from '../services/utente';
import { supabase } from '../services/supabase';

type ContattoPratica = { nominativo: string; telefono: string | null; email: string | null; riferimento: string | null };

const normalizza = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const pulisci = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

type RigaSync = { id: number; nominativo?: string; telefono?: string; email?: string; riferimento?: string; proprieta?: string; proprieta2?: string; telefono2?: string; mail?: string; mail2?: string; committente?: string };

const leggiTutto = async (tabella: string, campi: string, userId: string) => {
  const righe: RigaSync[] = [];
  const pagina = 1000;
  for (let da = 0; ; da += pagina) {
    let query = supabase.from(tabella).select(campi).order('id').range(da, da + pagina - 1);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    righe.push(...((data || []) as unknown as RigaSync[]));
    if (!data || data.length < pagina) break;
  }
  return righe;
};

// Allinea la rubrica con i contatti inseriti in Comune/Catasto, APE e Varie
export const sincronizzaRubricaDaPratiche = async (): Promise<{ aggiunti: number; aggiornati: number }> => {
  const userId = await richiediIdUtente();
  const campi = 'proprieta, proprieta2, telefono, telefono2, mail, committente';
  const leggiPratiche = async (tabella: string) => {
    try {
      return await leggiTutto(tabella, `${campi}, mail2`, userId);
    } catch {
      return await leggiTutto(tabella, campi, userId);
    }
  };
  const pratiche = [
    ...(await leggiPratiche('comune_catasto')),
    ...(await leggiPratiche('ape')),
    ...(await leggiPratiche('varie')),
  ];

  const daPratiche = new Map<string, ContattoPratica>();
  const aggiungi = (nome: string | null | undefined, telefono: string | null, email: string | null, riferimento: string | null) => {
    const nominativo = pulisci(nome);
    if (!nominativo) return;
    const chiave = normalizza(nominativo);
    const esistente = daPratiche.get(chiave);
    if (!esistente) {
      daPratiche.set(chiave, { nominativo: nominativo.replace(/\s+/g, ' '), telefono, email, riferimento });
      return;
    }
    esistente.telefono = esistente.telefono || telefono;
    esistente.email = esistente.email || email;
    esistente.riferimento = esistente.riferimento || riferimento;
  };

  pratiche.forEach((p) => {
    aggiungi(p.proprieta, pulisci(p.telefono), pulisci(p.mail), pulisci(p.committente));
    aggiungi(p.proprieta2, pulisci(p.telefono2), pulisci(p.mail2), pulisci(p.committente));
  });

  const rubrica = await leggiTutto('rubrica', 'id, nominativo, telefono, email, riferimento', userId);
  const inRubrica = new Map<string, RigaSync>();
  rubrica.forEach((c) => c.nominativo && inRubrica.set(normalizza(c.nominativo), c));

  const nuovi: ContattoPratica[] = [];
  let aggiornati = 0;
  for (const [chiave, contatto] of daPratiche) {
    const esistente = inRubrica.get(chiave);
    if (!esistente) {
      nuovi.push(contatto);
      continue;
    }
    const update: Record<string, string> = {};
    if (!pulisci(esistente.telefono) && contatto.telefono) update.telefono = contatto.telefono;
    if (!pulisci(esistente.email) && contatto.email) update.email = contatto.email;
    if (!pulisci(esistente.riferimento) && contatto.riferimento) update.riferimento = contatto.riferimento;
    if (Object.keys(update).length === 0) continue;
    const { error } = await supabase.from('rubrica').update(update).eq('id', esistente.id).eq('user_id', userId);
    if (error) throw error;
    aggiornati++;
  }

  for (let i = 0; i < nuovi.length; i += 200) {
    const blocco = nuovi.slice(i, i + 200).map((c) => ({ ...c, disattivato: false, user_id: userId }));
    const { error } = await supabase.from('rubrica').insert(blocco);
    if (error) throw error;
  }

  return { aggiunti: nuovi.length, aggiornati };
};

const syncContatto = async (
  nome: string | null | undefined,
  telefono: string | null | undefined,
  mail: string | null | undefined,
  committente: string | null | undefined
): Promise<void> => {
  const nominativo = pulisci(nome)?.replace(/\s+/g, ' ');
  if (!nominativo) return;

  try {
    const userId = await richiediIdUtente();
    const { data: risultati, error: searchError } = await supabase
      .from('rubrica')
      .select('id, nominativo, telefono, email, riferimento').eq('user_id', userId)
      .ilike('nominativo', nominativo.replace(/[\\%_]/g, (c) => `\\${c}`))
      .limit(10);

    if (searchError) {
      console.error('Errore ricerca contatto in rubrica:', searchError);
      return;
    }

    const dati = { telefono: pulisci(telefono), email: pulisci(mail), riferimento: pulisci(committente) };

    const existing = (risultati || []).filter((r) => normalizza(r.nominativo) === normalizza(nominativo));

    // Contatto già presente: completa solo i campi vuoti
    if (existing && existing.length > 0) {
      const contatto = existing[0];
      const update: Record<string, string> = {};
      if (!pulisci(contatto.telefono) && dati.telefono) update.telefono = dati.telefono;
      if (!pulisci(contatto.email) && dati.email) update.email = dati.email;
      if (!pulisci(contatto.riferimento) && dati.riferimento) update.riferimento = dati.riferimento;
      if (Object.keys(update).length === 0) return;
      const { error } = await supabase.from('rubrica').update(update).eq('id', contatto.id).eq('user_id', userId);
      if (error) console.error('Errore aggiornamento contatto in rubrica:', error);
      return;
    }

    const { error: insertError } = await supabase
      .from('rubrica')
      .insert([{ nominativo, ...dati, disattivato: false, user_id: userId }]);

    if (insertError) {
      console.error('Errore creazione contatto in rubrica:', insertError);
    }
  } catch (error) {
    console.error('Errore sync rubrica:', error);
  }
};

// Proprietario 1 -> telefono/mail, Proprietario 2 -> telefono2/mail2
export const syncRubricaFromPratica = async (
  proprieta: string | null | undefined,
  telefono: string | null | undefined,
  mail: string | null | undefined,
  committente: string | null | undefined,
  proprieta2?: string | null,
  telefono2?: string | null,
  mail2?: string | null
): Promise<void> => {
  await syncContatto(proprieta, telefono, mail, committente);
  await syncContatto(proprieta2, telefono2, mail2, committente);
};


// Modifica in rubrica: riporta nome, telefono ed email nelle pratiche con quel proprietario (1 o 2)
export const propagaContattoAPratiche = async (
  vecchioNome: string,
  nuovo: { nominativo: string; telefono: string | null; email: string | null }
): Promise<number> => {
  const userId = await richiediIdUtente();
  const nome = normalizza(vecchioNome);
  if (!nome) return 0;
  let aggiornate = 0;
  for (const tabella of ['comune_catasto', 'ape', 'varie']) {
    const pratiche = await leggiTutto(tabella, 'id, proprieta, proprieta2', userId);
    for (const [campoNome, campoTel, campoMail] of [['proprieta', 'telefono', 'mail'], ['proprieta2', 'telefono2', 'mail2']] as const) {
      const id = pratiche.filter((r) => normalizza(r[campoNome] || '') === nome).map((r) => r.id);
      const dati = { [campoNome]: nuovo.nominativo, [campoTel]: pulisci(nuovo.telefono), [campoMail]: pulisci(nuovo.email) };
      for (let da = 0; da < id.length; da += 200) {
        const { data, error } = await supabase.from(tabella).update(dati).eq('user_id', userId).in('id', id.slice(da, da + 200)).select('id');
        if (error) throw error;
        aggiornate += data?.length || 0;
      }
    }
  }
  return aggiornate;
};
