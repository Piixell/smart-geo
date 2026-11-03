import { useEffect } from 'react';

const INTERATTIVI = 'button, a, input, select, textarea, label, [role="button"]';
const LARGHI = ['committente', 'propriet', 'indirizzo', 'note', 'descrizione', 'cliente', 'nome', 'oggetto', 'email'];
const TABELLE = 'table.tabella-distesa, table.tabella-mobile';

// Sul telefono: etichette per le tabelle a schede e tocco singolo per aprire la riga
const etichetta = () => {
  document.querySelectorAll<HTMLTableElement>(TABELLE).forEach((t) => {
    const righeTesta = t.querySelectorAll('thead tr');
    const intestazioni: string[] = [];
    righeTesta[0]?.querySelectorAll(':scope > *').forEach((th) => {
      const testo = (th.textContent || '').trim();
      for (let i = 0; i < ((th as HTMLTableCellElement).colSpan || 1); i++) intestazioni.push(testo);
    });
    if (righeTesta.length > 1) {
      const filtri = righeTesta[righeTesta.length - 1];
      filtri.classList.add('riga-filtri');
      filtri.querySelectorAll(':scope > *').forEach((th, i) => {
        if (intestazioni[i] && th.getAttribute('data-label') !== intestazioni[i]) th.setAttribute('data-label', intestazioni[i]);
      });
    }
    t.querySelectorAll('tbody tr, tfoot tr').forEach((tr) => {
      const celle = Array.from(tr.children) as HTMLTableCellElement[];
      if (celle.length === 1 && celle[0].colSpan > 1) return;
      tr.classList.add('riga-scheda');
      let col = 0;
      celle.forEach((td) => {
        const span = td.colSpan || 1;
        const nome = span > 1 ? '' : intestazioni[col] || '';
        col += span;
        if (nome && td.getAttribute('data-label') !== nome) td.setAttribute('data-label', nome);
        if (span > 1 || LARGHI.some((l) => nome.toLowerCase().includes(l))) td.classList.add('campo-largo');
      });
    });
  });
};

export const TabelleMobili: React.FC = () => {
  useEffect(() => {
    let attesa = 0;
    const osserva = new MutationObserver(() => {
      cancelAnimationFrame(attesa);
      attesa = requestAnimationFrame(etichetta);
    });
    osserva.observe(document.body, { childList: true, subtree: true });
    etichetta();
    const tocco = (e: MouseEvent) => {
      if (window.innerWidth >= 768) return;
      const el = e.target as HTMLElement;
      const riga = el.closest('table tbody tr.riga-scheda');
      if (!riga || !riga.closest(TABELLE) || el.closest(INTERATTIVI) || /stato/i.test(el.closest('td')?.getAttribute('data-label') || '')) return;
      riga.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    };
    document.addEventListener('click', tocco);
    return () => { osserva.disconnect(); document.removeEventListener('click', tocco); };
  }, []);
  return null;
};
