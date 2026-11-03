import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabase';
import { richiediIdUtente } from '../services/utente';

const TABELLE = [
  'comune_catasto', 'ape', 'varie', 'rubrica', 'fatture', 'scadenze', 'preventivi', 'prestazioni',
  'planner_tasks', 'planner_categories', 'parametri_azienda', 'parametri_fatturazione', 'tipi_incarico',
  'tipi_incarico_varie', 'tipi_pratica', 'stati_ape', 'stati_generali', 'stati_varie', 'stati_scadenze',
  'committenti_nascosti', 'impostazioni', 'profiles', 'fatture_non_contabilizzate', 'tipologia_contatti', 'tipologie_appartenenza',
];

const TABELLE_CONDIVISE = new Set(['parametri_azienda', 'tipi_incarico', 'tipi_pratica', 'stati_ape', 'stati_generali', 'stati_varie', 'stati_scadenze', 'tipologia_contatti', 'tipologie_appartenenza']);

const leggiTutto = async (tabella: string, userId: string) => {
  const righe: unknown[] = [];
  for (let da = 0; ; da += 1000) {
    let query = supabase.from(tabella).select('*').order('id', { ascending: true }).range(da, da + 999);
    if (tabella === 'impostazioni') query = supabase.from(tabella).select('*').eq('user_id', userId).order('user_id').range(da, da + 999);
    else if (tabella === 'committenti_nascosti') query = supabase.from(tabella).select('*').eq('user_id', userId).order('nome').range(da, da + 999);
    else if (!TABELLE_CONDIVISE.has(tabella)) query = query.eq(tabella === 'profiles' ? 'id' : 'user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    righe.push(...(data || []));
    if (!data || data.length < 1000) return righe;
  }
};

export const BackupSection: React.FC = () => {
  const [stato, setStato] = useState('');
  const [inCorso, setInCorso] = useState(false);

  const scarica = async () => {
    if (inCorso) return;
    setInCorso(true);
    try {
    const userId = await richiediIdUtente();
    const copia: Record<string, unknown[]> = {};
    const errori: string[] = [];
    for (const t of TABELLE) {
      setStato(`Sto leggendo: ${t}…`);
      try { copia[t] = await leggiTutto(t, userId); } catch { errori.push(t); }
    }
    if (await richiediIdUtente() !== userId) throw new Error('Account cambiato durante la copia');
    const oggi = new Date().toISOString().split('T')[0];
    const file = new Blob([JSON.stringify({ creato_il: new Date().toISOString(), completo: errori.length === 0, tabelle_non_lette: errori, tabelle: copia }, null, 2)], { type: 'application/json' });
    const scaricaFile = (blob: Blob, nome: string) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nome;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    scaricaFile(file, `copia-gestionale-${oggi}${errori.length ? '-parziale' : ''}.json`);
    const totale = Object.values(copia).reduce((s, r) => s + r.length, 0);
    setStato(`Copia scaricata: ${totale} record${errori.length ? ` · non lette: ${errori.join(', ')}` : ''}`);
    if (errori.length) toast.error(`Alcune tabelle non sono state lette: ${errori.join(', ')}`);
    else toast.success('Copia di tutti i dati scaricata');
    } catch {
      toast.error('Copia non riuscita: verifica la sessione e riprova');
    } finally { setInCorso(false); }
  };

  return (
    <div className="card p-6" data-testid="backup-section">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold text-ink-900">Copia di sicurezza dei dati</h2>
            <p className="text-sm text-ink-500">Scarica in un unico file completo tutti i dati del gestionale: pratiche, rubrica, fatture, spese, preventivi, agenda, parametri e impostazioni. Conservalo su una chiavetta o sul NAS.</p>
            {stato && <p className="mt-1 text-xs text-ink-600" data-testid="backup-stato">{stato}</p>}
          </div>
        </div>
        <button type="button" onClick={scarica} disabled={inCorso} className="btn-primary inline-flex items-center gap-2" data-testid="backup-scarica">
          <Download className="h-4 w-4" /> Scarica tutti i dati
        </button>
      </div>
    </div>
  );
};
