import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { caricaImpostazioni, useImpostazioni } from '../../services/impostazioni';
import { TabelleMobili } from './TabelleMobili';

// Applica colori, dimensione del testo e titolo scelti in Parametri
const StileImpostazioni: React.FC = () => {
  const { aspetto } = useImpostazioni();
  useEffect(() => {
    document.documentElement.style.fontSize = `${aspetto.dimensioneTesto || 100}%`;
    document.title = aspetto.titoloScheda;
  }, [aspetto.dimensioneTesto, aspetto.titoloScheda]);
  return (
    <style>{`html:not(.dark) .btn-primary{background-color:${aspetto.coloreBottoni}!important;border-color:${aspetto.coloreBottoni}!important}
html:not(.dark) .app-sfondo{background-color:${aspetto.coloreSfondo}!important}`}</style>
  );
};

export const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let attivo = true;
    caricaImpostazioni().catch(() => {
      if (attivo) toast.error('Impostazioni non caricate: verifica le migrazioni del database');
    }).finally(() => { if (attivo) setPronto(true); });
    return () => { attivo = false; };
  }, []);

  if (!pronto) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-ink-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-signal-500" />
      </div>
    );
  }

  return (
    <div className="app-sfondo flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-ink-50">
      <StileImpostazioni />
      <TabelleMobili />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-sfondo flex-1 overflow-y-auto overflow-x-hidden bg-ink-50">
          <div key={pathname} className="pagina-animata w-full mx-auto px-4 py-3">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
