import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { PREDEFINITE, salvaImpostazioni, useImpostazioni, type Impostazioni } from '../services/impostazioni';

type Gruppo = keyof Impostazioni;
type Campo = { k: string; label: string; tipo?: 'numero' | 'testo' | 'area' | 'mese-giorno' | 'colore' | 'immagine'; aiuto?: string };

const GRUPPI: { id: Gruppo; titolo: string; descrizione: string; campi: Campo[] }[] = [
  { id: 'fisco', titolo: 'Regole fiscali e contributi', descrizione: 'Percentuali usate in Contabilità, Spese e Preventivi', campi: [
    { k: 'coefficiente', label: 'Coefficiente di redditività (%)', tipo: 'numero' },
    { k: 'aliquotaFino', label: 'Aliquota tasse prima del cambio (%)', tipo: 'numero' },
    { k: 'aliquotaDal', label: 'Aliquota tasse dal cambio (%)', tipo: 'numero' },
    { k: 'annoCambio', label: 'Anno del cambio aliquota', tipo: 'numero' },
    { k: 'cassa', label: 'Contributo integrativo cassa (%)', tipo: 'numero' },
    { k: 'acconto', label: 'Ciascun acconto tasse (% delle tasse anno precedente)', tipo: 'numero' },
    { k: 'maternita', label: 'Maternità predefinita (€)', tipo: 'numero' },
    { k: 'bolloImporto', label: 'Bollo sulle fatture (€)', tipo: 'numero' },
    { k: 'bolloSoglia', label: 'Bollo applicato se il fatturato supera (€)', tipo: 'numero' },
  ] },
  { id: 'scadenze', titolo: 'Date delle scadenze', descrizione: 'Giorno e mese usati quando una voce automatica viene creata per la prima volta', campi: [
    { k: 'acconto1', label: '1° acconto tasse', tipo: 'mese-giorno' },
    { k: 'acconto2', label: '2° acconto tasse', tipo: 'mese-giorno' },
    { k: 'saldo', label: 'Saldo tasse (anno successivo)', tipo: 'mese-giorno' },
    { k: 'integrativo', label: 'Contributo integrativo (anno successivo)', tipo: 'mese-giorno' },
    { k: 'soggettivo', label: 'Contributo soggettivo e maternità', tipo: 'mese-giorno' },
  ] },
  { id: 'preventivi', titolo: 'Testi e PDF dei preventivi', descrizione: 'Valgono per i nuovi preventivi e per i PDF', campi: [
    { k: 'luogo', label: 'Luogo nella data' },
    { k: 'firma', label: 'Nome sotto la firma digitale' },
    { k: 'intro', label: 'Testo iniziale (dopo il saluto)', tipo: 'area' },
    { k: 'note', label: 'Condizioni predefinite (una per riga, sottocondizioni con «-»)', tipo: 'area' },
    { k: 'piede.0', label: 'Piè di pagina · colonna sinistra', tipo: 'area' },
    { k: 'piede.1', label: 'Piè di pagina · colonna centrale', tipo: 'area' },
    { k: 'piede.2', label: 'Piè di pagina · colonna destra', tipo: 'area' },
    { k: 'bollo', label: 'Bollo predefinito (€)', tipo: 'numero' },
    { k: 'logoPdf', label: 'Logo in alto nel PDF', tipo: 'immagine', aiuto: 'Se vuoto si usa il logo attuale' },
  ] },
  { id: 'pagine', titolo: 'Impostazioni delle pagine', descrizione: 'Soglie della Dashboard, elenchi e suggerimenti degli indirizzi', campi: [
    { k: 'giorniFermo', label: 'Giorni dopo cui una pratica è «ferma»', tipo: 'numero' },
    { k: 'giorniAvvisoSpese', label: 'Giorni di preavviso per l\'avviso spese in alto', tipo: 'numero' },
    { k: 'giorniScadenzeDashboard', label: 'Giorni del riquadro «Spese in scadenza»', tipo: 'numero' },
    { k: 'righePratiche', label: 'Righe mostrate di base in Comune/Catasto, APE e Varie', tipo: 'numero' },
    { k: 'mappaLat', label: 'Centro suggerimenti indirizzi · latitudine (Torino 45.0703)', tipo: 'numero' },
    { k: 'mappaLon', label: 'Centro suggerimenti indirizzi · longitudine (Torino 7.6869)', tipo: 'numero' },
  ] },
  { id: 'aspetto', titolo: 'Aspetto e logo', descrizione: 'Nome, logo, colori e dimensione del testo', campi: [
    { k: 'nome', label: 'Nome nella barra laterale' },
    { k: 'sottotitolo', label: 'Sottotitolo nella barra laterale' },
    { k: 'nomeCompleto', label: 'Nome completo (accesso e intestazioni)' },
    { k: 'titoloScheda', label: 'Titolo della scheda del browser' },
    { k: 'coloreBarra', label: 'Colore della barra laterale', tipo: 'colore' },
    { k: 'coloreBottoni', label: 'Colore dei pulsanti principali', tipo: 'colore' },
    { k: 'coloreSfondo', label: 'Colore dello sfondo delle pagine (tema chiaro)', tipo: 'colore' },
    { k: 'dimensioneTesto', label: 'Dimensione del testo (%, 100 = normale)', tipo: 'numero' },
    { k: 'logo', label: 'Logo del gestionale', tipo: 'immagine', aiuto: 'Se vuoto si usa il logo AZ' },
  ] },
  { id: 'menu', titolo: 'Nomi del menu', descrizione: 'Testi delle voci e dei gruppi nella barra laterale', campi: [
    { k: 'gruppoPratiche', label: 'Gruppo «Pratiche»' },
    { k: 'gruppoAmministrazione', label: 'Gruppo «Amministrazione»' },
    { k: 'gruppoConfigurazione', label: 'Gruppo «Configurazione»' },
    ...['/', '/planner', '/comune-catasto', '/ape', '/varie', '/preventivi', '/contabilita', '/spese', '/rubrica', '/parametri'].map((k) => ({ k, label: `Voce «${PREDEFINITE.menu[k]}»` })),
  ] },
];

const leggi = (o: Record<string, unknown>, k: string) => {
  const [a, b] = k.startsWith('/') ? [k] : k.split('.');
  return b === undefined ? o[a] : (o[a] as unknown[])[Number(b)];
};
const scrivi = (o: Record<string, unknown>, k: string, v: unknown) => {
  const [a, b] = k.startsWith('/') ? [k] : k.split('.');
  if (b === undefined) return { ...o, [a]: v };
  const arr = [...(o[a] as unknown[])];
  arr[Number(b)] = v;
  return { ...o, [a]: arr };
};

const caricaImmagine = (file: File, fine: (url: string) => void) => {
  if (file.size > 500000) { toast.error('Immagine troppo grande (massimo 500 KB)'); return; }
  const fr = new FileReader();
  fr.onload = () => fine(fr.result as string);
  fr.readAsDataURL(file);
};

const CampoInput: React.FC<{ c: Campo; valore: unknown; onChange: (v: unknown) => void; testId: string }> = ({ c, valore, onChange, testId }) => {
  if (c.tipo === 'area') return <textarea value={String(valore ?? '')} onChange={(e) => onChange(e.target.value)} rows={c.k === 'note' || c.k === 'intro' ? 7 : 3} className="input h-auto w-full" data-testid={testId} />;
  if (c.tipo === 'numero') return <input type="number" step="0.01" value={String(valore ?? '')} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} className="input w-full" data-testid={testId} />;
  if (c.tipo === 'colore') return <input type="color" value={String(valore)} onChange={(e) => onChange(e.target.value)} className="h-10 w-20 cursor-pointer rounded border border-ink-200" data-testid={testId} />;
  if (c.tipo === 'mese-giorno') {
    const [m, g] = String(valore).split('-');
    return (
      <div className="flex gap-2">
        <input type="number" min={1} max={31} value={Number(g)} onChange={(e) => onChange(`${m}-${String(e.target.value).padStart(2, '0')}`)} className="input w-20" data-testid={`${testId}-giorno`} />
        <select value={m} onChange={(e) => onChange(`${e.target.value}-${g}`)} className="input flex-1" data-testid={`${testId}-mese`}>
          {['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'].map((n, i) => (
            <option key={n} value={String(i + 1).padStart(2, '0')}>{n}</option>
          ))}
        </select>
      </div>
    );
  }
  if (c.tipo === 'immagine') return (
    <div className="flex items-center gap-3">
      {valore ? <img src={String(valore)} alt="" className="h-10 w-auto rounded border border-ink-200 bg-white p-1" /> : <span className="text-xs text-ink-400">{c.aiuto}</span>}
      <input type="file" accept="image/png,image/jpeg" onChange={(e) => e.target.files?.[0] && caricaImmagine(e.target.files[0], onChange)} className="text-xs" data-testid={testId} />
      {!!valore && <button type="button" onClick={() => onChange('')} className="text-xs text-red-600 hover:underline">Rimuovi</button>}
    </div>
  );
  return <input value={String(valore ?? '')} onChange={(e) => onChange(e.target.value)} className="input w-full" data-testid={testId} />;
};

const SchedaGruppo: React.FC<{ g: typeof GRUPPI[number] }> = ({ g }) => {
  const attuali = useImpostazioni();
  const [bozza, setBozza] = useState<Record<string, unknown>>(attuali[g.id] as unknown as Record<string, unknown>);
  const [salvo, setSalvo] = useState(false);
  const salva = async () => {
    setSalvo(true);
    try {
      await salvaImpostazioni({ ...attuali, [g.id]: bozza });
      toast.success(`${g.titolo}: salvato`);
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSalvo(false);
    }
  };
  return (
    <div className="card p-6" data-testid={`impostazioni-${g.id}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink-800 dark:text-white">{g.titolo}</h3>
          <p className="text-sm text-ink-500">{g.descrizione}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setBozza(PREDEFINITE[g.id] as unknown as Record<string, unknown>)} className="btn-secondary inline-flex items-center gap-1.5" data-testid={`impostazioni-${g.id}-ripristina`}><RotateCcw className="h-4 w-4" /> Valori iniziali</button>
          <button type="button" onClick={salva} disabled={salvo} className="btn-primary inline-flex items-center gap-1.5" data-testid={`impostazioni-${g.id}-salva`}><Save className="h-4 w-4" /> Salva</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {g.campi.map((c) => (
          <label key={c.k} className={`block ${c.tipo === 'area' || c.tipo === 'immagine' ? 'md:col-span-2' : ''}`}>
            <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-gray-300">{c.label}</span>
            <CampoInput c={c} valore={leggi(bozza, c.k)} onChange={(v) => setBozza((b) => scrivi(b, c.k, v))} testId={`impostazioni-${g.id}-${c.k.replace(/[./]/g, '-') || 'home'}`} />
          </label>
        ))}
      </div>
    </div>
  );
};

export const ImpostazioniSection: React.FC = () => (
  <div className="space-y-6" data-testid="impostazioni-section">
    <div className="flex items-center gap-2">
      <SlidersHorizontal className="h-5 w-5 text-ink-500" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Regole e testi del gestionale</h2>
    </div>
    {GRUPPI.map((g) => <SchedaGruppo key={g.id} g={g} />)}
  </div>
);
