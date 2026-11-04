import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { AvvisoScadenzeSpese } from '../components/AvvisoScadenzeSpese';
import { caricaDashboard, type DashboardData, type Conteggi } from '../utils/dashboardData';
import { Kpi, Riquadro, GraficoMesi, euro } from '../components/dashboard/Widgets';
import { AccessoRapido, RiepilogoPreventivi, ScadenzeProssime, PraticheFerme } from '../components/dashboard/AltriWidget';

// filtro: query string applicata alla sezione (null = nessun collegamento)
const perSezione = (c: Conteggi, filtro: { comune: string; varie: string; ape: string | null }) => [
  { label: 'Pratiche comunali e catastali', valore: c.comune, to: `/comune-catasto?${filtro.comune}` },
  { label: 'Pratiche varie', valore: c.varie, to: `/varie?${filtro.varie}` },
  { label: 'Attestati di Prestazione Energetica', valore: c.ape, to: filtro.ape ? `/ape?${filtro.ape}` : undefined },
];
const DA_FARE = { comune: 'stato=1', varie: 'stato=1', ape: 'stato=1' };
const ISTRUTTORIA = { comune: 'stato=5', varie: 'stato=5', ape: null };
const INCASSARE = { comune: 'stato=3&incassare=1', varie: 'stato=3&incassare=1', ape: 'stato=3&incassare=1' };

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [dati, setDati] = useState<DashboardData | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [tentativo, setTentativo] = useState(0);
  const anno = new Date().getFullYear();

  useEffect(() => {
    let attivo = true;
    setDati(null);
    setErrore(null);
    if (user?.id) {
      caricaDashboard(user.id).then((nuoviDati) => {
        if (attivo) setDati(nuoviDati);
      }).catch((e) => {
        console.error('Errore dashboard:', e);
        if (attivo) setErrore('Impossibile caricare tutti i dati della dashboard. Riprova.');
      });
    }
    return () => { attivo = false; };
  }, [user?.id, tentativo]);

  return (
    <div className="space-y-6" data-testid="dashboard">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-700">Bentornato, {user?.name || user?.username || 'Utente'}</h1>
        <p className="mt-1 capitalize text-ink-500">
          {new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <AvvisoScadenzeSpese userId={user?.id} />

      {errore ? (
        <div className="card p-6 text-ink-800" role="alert">
          <p>{errore}</p>
          <button type="button" className="btn btn-secondary mt-3" onClick={() => setTentativo((n) => n + 1)}>Riprova</button>
        </div>
      ) : !dati ? (
        <div className="flex items-center gap-2 py-12 text-sm text-ink-500" data-testid="dashboard-caricamento">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-signal-600" /> Caricamento dati...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Pratiche da fare" valore={dati.daFare.totale} dettaglio={perSezione(dati.daFare, DA_FARE)} to="/comune-catasto" accento="bg-yellow-500" testId="kpi-da-fare" />
            <Kpi label="In istruttoria" valore={dati.inIstruttoria.totale} dettaglio={perSezione(dati.inIstruttoria, ISTRUTTORIA)} to="/comune-catasto" accento="bg-red-600" testId="kpi-istruttoria" />
            <Kpi label="Da incassare" valore={dati.daIncassare.totale} dettaglio={perSezione(dati.daIncassare, INCASSARE)} to="/varie" accento="bg-emerald-500" testId="kpi-da-incassare" />
            <Kpi
              label={`Fatturato ${anno}`}
              valore={dati.fatturatoAnno}
              valuta
              dettaglio={[{ label: 'Onorario', valore: euro(dati.onorarioAnno, 2) }]}
              to="/contabilita"
              accento="bg-signal-500"
              testId="kpi-fatturato"
            />
          </div>

          <AccessoRapido />

          <Riquadro titolo={`Fatturato mensile ${anno}`} azione={{ label: 'Contabilità', to: '/contabilita' }} testId="riquadro-fatturato">
            <GraficoMesi anno={dati.fatturatoMesi.anno} precedente={dati.fatturatoMesi.precedente} annoCorrente={anno} />
          </Riquadro>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RiepilogoPreventivi dati={dati.preventivi} anno={anno} />
            <ScadenzeProssime scadenze={dati.scadenze} />
          </div>

          <PraticheFerme pratiche={dati.ferme} />
        </>
      )}
    </div>
  );
};
