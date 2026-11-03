import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileCheck, FolderOpen, FileText, ChevronRight } from 'lucide-react';
import { STATI_PREVENTIVO } from '../../utils/preventivi';
import { giorniFermo, giorniScadenze, type DashboardData } from '../../utils/dashboardData';
import { Riquadro, PERCORSO, euro } from './Widgets';

const AZIONI = [
  { label: 'Pratica comunale / catastale', to: '/comune-catasto?nuovo=1', Icona: Building2, id: 'comune' },
  { label: 'Pratica varia', to: '/varie?nuovo=1', Icona: FolderOpen, id: 'varie' },
  { label: 'Attestato APE', to: '/ape?nuovo=1', Icona: FileCheck, id: 'ape' },
  { label: 'Preventivo', to: '/preventivi?nuovo=1', Icona: FileText, id: 'preventivo' },
];

export const AccessoRapido: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="accesso-rapido">
      {AZIONI.map(({ label, to, Icona, id }) => (
        <button key={id} onClick={() => navigate(to)} className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 text-left transition-[border-color,box-shadow] hover:border-ink-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800" data-testid={`accesso-rapido-${id}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-700 dark:bg-gray-700 dark:text-gray-200"><Icona className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-400">Nuovo</span>
            <span className="block truncate text-sm font-semibold text-ink-800 dark:text-gray-100">{label}</span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" />
        </button>
      ))}
    </div>
  );
};

export const RiepilogoPreventivi: React.FC<{ dati: DashboardData['preventivi']; anno: number }> = ({ dati, anno }) => (
  <Riquadro titolo="Preventivi" azione={{ label: 'Preventivi', to: '/preventivi' }} testId="riquadro-preventivi">
    <div className="grid grid-cols-4 divide-x divide-ink-100 border-b border-ink-100 dark:divide-gray-700 dark:border-gray-700">
      {STATI_PREVENTIVO.map((s) => (
        <div key={s.id} className="px-3 py-4 text-center" data-testid={`preventivi-conteggio-${s.id}`}>
          <div className="text-2xl font-bold tabular-nums text-ink-900 dark:text-white">{dati.conteggi[s.id] || 0}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">{s.label}</div>
        </div>
      ))}
    </div>
    <div className="divide-y divide-ink-100 text-sm dark:divide-gray-700">
      <div className="flex items-center justify-between px-5 py-2.5" data-testid="preventivi-in-attesa">
        <span className="text-ink-600 dark:text-gray-300">In attesa di risposta (inviati)</span>
        <span className="font-semibold tabular-nums text-ink-900 dark:text-white">{euro(dati.inAttesa, 2)}</span>
      </div>
      <div className="flex items-center justify-between bg-ink-50 px-5 py-2.5 font-bold dark:bg-gray-700/50" data-testid="preventivi-accettati-anno">
        <span className="text-ink-800 dark:text-gray-100">Accettati nel {anno}</span>
        <span className="tabular-nums text-ink-900 dark:text-white">{euro(dati.accettatiAnno, 2)}</span>
      </div>
    </div>
  </Riquadro>
);

const giorniA = (d: string) => {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${d}T00:00:00`).getTime() - oggi.getTime()) / 86400000);
};
const quando = (g: number) => (g < 0 ? `Scaduta da ${-g} gg` : g === 0 ? 'Oggi' : `Tra ${g} gg`);

export const ScadenzeProssime: React.FC<{ scadenze: DashboardData['scadenze'] }> = ({ scadenze }) => (
  <Riquadro titolo={`Spese in scadenza · ${giorniScadenze()} giorni`} azione={{ label: 'Spese', to: '/spese' }} testId="riquadro-scadenze">
    {scadenze.length === 0 ? <p className="px-5 py-6 text-sm text-ink-500">Nessuna spesa da pagare nei prossimi {giorniScadenze()} giorni.</p> : (
      <>
        <ul className="max-h-64 divide-y divide-ink-100 overflow-y-auto dark:divide-gray-700">
          {scadenze.map((s) => {
            const g = giorniA(s.data_scadenza!);
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm" data-testid={`scadenza-${s.id}`}>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink-900 dark:text-white">{s.descrizione}</span>
                  <span className={`text-xs ${g < 0 ? 'text-red-600' : g <= 7 ? 'text-amber-700' : 'text-ink-500'}`}>{quando(g)} · {new Date(`${s.data_scadenza}T00:00:00`).toLocaleDateString('it-IT')}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-ink-900 dark:text-white">{euro(Number(s.spese), 2)}</span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50 px-5 py-2.5 text-sm font-bold dark:border-gray-700 dark:bg-gray-700/50" data-testid="scadenze-totale">
          <span>Totale</span>
          <span className="tabular-nums">{euro(scadenze.reduce((t, s) => t + Number(s.spese), 0), 2)}</span>
        </div>
      </>
    )}
  </Riquadro>
);

const ORDINE_GRUPPI = ['Comunali e catastali', 'Pratiche varie', 'APE'];

const RigaFerma: React.FC<{ p: DashboardData['ferme'][number] }> = ({ p }) => {
  const navigate = useNavigate();
  return (
    <li>
      <button onClick={() => navigate(`${PERCORSO[p.sezione]}?apri=${p.id}`)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-2.5 text-left hover:bg-ink-50 dark:hover:bg-gray-700/50 sm:grid-cols-[1fr_9rem_6rem]" data-testid={`ferma-${p.sezione}-${p.id}`}>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">{p.proprieta} · {p.committente}</span>
          <span className="block truncate text-xs text-ink-500">{p.indirizzo}{p.citta ? `, ${p.citta}` : ''}</span>
        </span>
        <span className="hidden text-xs text-ink-600 sm:block">{p.stato}</span>
        <span className="text-right text-xs font-semibold tabular-nums text-amber-700">{p.giorniFermo} giorni</span>
      </button>
    </li>
  );
};

export const PraticheFerme: React.FC<{ pratiche: DashboardData['ferme'] }> = ({ pratiche }) => {
  const gruppi = ORDINE_GRUPPI.map((g) => ({ g, righe: pratiche.filter((p) => p.gruppo === g).sort((a, b) => b.giorniFermo - a.giorniFermo) })).filter((x) => x.righe.length);
  return (
    <Riquadro titolo={`Pratiche ferme da oltre ${giorniFermo()} giorni · ${pratiche.length}`} testId="riquadro-ferme">
      {pratiche.length === 0 ? <p className="px-5 py-6 text-sm text-ink-500">Nessuna pratica ferma: tutto procede.</p> : (
        <div>
          {gruppi.map(({ g, righe }) => (
            <section key={g} data-testid={`ferme-gruppo-${g.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
              <h3 className="flex items-center justify-between border-y border-ink-100 bg-ink-50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {g}<span className="tabular-nums text-ink-400">{righe.length}</span>
              </h3>
              <ul className="divide-y divide-ink-100 dark:divide-gray-700">{righe.map((p) => <RigaFerma key={`${p.sezione}-${p.id}`} p={p} />)}</ul>
            </section>
          ))}
        </div>
      )}
    </Riquadro>
  );
};
