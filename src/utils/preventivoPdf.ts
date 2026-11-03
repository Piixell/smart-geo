import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calcolaTotali, normalizzaPreventivo, type Preventivo } from './preventivi';
import { nomeFilePreventivo, oggettoAutomatico, salutoAutomatico, soggetti } from './saluto';
import { cfg } from '../services/impostazioni';

const studio = () => {
  const p = cfg().preventivi;
  return { firma: p.firma, luogo: p.luogo, piede: p.piede.map((c) => c.split('\n').filter(Boolean)) };
};

const importo = (v: number) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const dataLunga = (d: string) => {
  const s = new Date(`${d}T00:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  return s.replace(/ (\p{L})/u, (_, c) => ` ${c.toUpperCase()}`);
};

const caricaLogo = async () => {
  if (cfg().preventivi.logoPdf) return cfg().preventivi.logoPdf;
  const blob = await fetch('/logo-preventivo.png').then((r) => r.blob());
  return new Promise<string>((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.readAsDataURL(blob);
  });
};

const NERO: [number, number, number] = [0, 0, 0];
// Helvetica standard non ha apostrofi tipografici
const pulisci = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/(\d)[ \u00a0]+€/g, '$1 €').replace(/€[ \u00a0]+/g, '€ ');
const W = 210;
const M = 16;
const FONDO = 262;

export const esportaPreventivoPdf = async (p: Preventivo, firmaDigitale = false) => {
  p = normalizzaPreventivo(p);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  // jsPDF sottostima i caratteri non ASCII (À, °, €): si misura la versione senza accenti
  const larg = (s: string) => doc.getTextWidth(s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/°/g, 'o').replace(/€/g, 'C'));
  const t = calcolaTotali(p);
  p = { ...p, cliente: pulisci(p.cliente), saluto: pulisci(p.saluto || ''), oggetto: pulisci(p.oggetto), note: pulisci(p.note), indirizzo_cliente: pulisci(p.indirizzo_cliente), voci: p.voci.map((v) => ({ ...v, descrizione: pulisci(v.descrizione), dettagli: pulisci(v.dettagli || '') })) };
  let logo = '';
  try { logo = await caricaLogo(); } catch { /* logo non disponibile */ }

  // Piè di pagina come nel modello dello studio: solo nell'ultima pagina
  const piede = () => {
    doc.setDrawColor(...NERO).setLineWidth(0.09).line(M, 264.6, W - M, 264.6);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...NERO);
    studio().piede.forEach((col, c) => {
      const w0 = larg(col[0] || '');
      const x = [M + w0 / 2, W / 2, W - M - 0.3 - w0 / 2][c];
      col.forEach((r, i) => doc.text(r, x, 271 + i * 7.9, { align: 'center' }));
    });
  };
  const spazio = (h: number, y: number) => {
    if (y + h <= FONDO) return y;
    doc.addPage();
    doc.setTextColor(...NERO).setDrawColor(...NERO);
    return 22;
  };

  // Intestazione come nel modello dello studio: solo nella prima pagina
  if (logo) doc.addImage(logo, 'PNG', 87.8, 4.6, 34.2, 32.7, 'logo', 'FAST');
  doc.setDrawColor(...NERO).setLineWidth(0.09).line(M, 44.7, W - M, 44.7);

  doc.setFontSize(10).setTextColor(...NERO).text(`${studio().luogo}, l\u00ec ${dataLunga(p.data)}`, M, 57);

  const nomi = soggetti(p.cliente).map((n) => n.toUpperCase());
  const localita = [p.cap_cliente, p.citta_cliente, p.provincia_cliente].map((x) => (x || '').trim()).filter(Boolean).join(' ');
  const datiCliente = [...p.indirizzo_cliente.split('\n'), localita];
  const paese = (p.paese_cliente || '').trim();
  const residenza = datiCliente.some((r) => r.trim())
    ? [...p.indirizzo_cliente.split('\n'), [localita, paese].filter(Boolean).join(' ')]
    : [p.indirizzo_immobile, p.citta_immobile];
  const righeCliente = [...residenza, p.codice_fiscale_cliente].map((r) => r.trim().toUpperCase()).filter(Boolean);
  doc.setFont('helvetica', 'bolditalic').setFontSize(10);
  const largNomi = Math.max(0, ...nomi.map(larg));
  doc.setFont('helvetica', 'italic').setFontSize(9);
  const largInd = Math.max(0, ...righeCliente.map(larg));
  const xC = Math.max(M + 40, W - M - Math.max(largNomi, largInd));
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...NERO).text('Spett.le', xC - 4, 68, { align: 'right' });
  doc.setFont('helvetica', 'bolditalic');
  const PASSO = 4.6;
  nomi.forEach((n, i) => doc.text(n, xC, 68 + i * PASSO));
  const yInd = 68 + nomi.length * PASSO;
  doc.setFont('helvetica', 'italic').setFontSize(9);
  righeCliente.forEach((r, i) => doc.text(r, xC, yInd + i * PASSO));
  let y = Math.max(88, yInd + 3.5 + righeCliente.length * PASSO) + 5;

  const oggetto = oggettoAutomatico(p.citta_immobile, p.indirizzo_immobile);
  doc.setFont('helvetica', 'bold').setFontSize(10.5).text('Oggetto:', M, y);
  doc.setFont('helvetica', 'normal').setFontSize(9.5).setLineWidth(0.2).setDrawColor(...NERO);
  const righeOgg = doc.splitTextToSize(oggetto, W - 2 * M - 18);
  righeOgg.forEach((r: string, i: number) => {
    doc.text(r, M + 17, y + i * 4.5);
    doc.line(M + 17, y + 0.8 + i * 4.5, M + 17 + larg(r) + 1.2, y + 0.8 + i * 4.5);
  });
  y += righeOgg.length * 4.5 + 6;

  doc.setFont('helvetica', 'italic').setFontSize(9);
  const intro = doc.splitTextToSize(`${salutoAutomatico(p.cliente) ? `${salutoAutomatico(p.cliente)},\n` : ''}${cfg().preventivi.intro}`, W - 2 * M);
  doc.text(intro, M, y);
  y += intro.length * 4.2 + 6;

  p.voci.forEach((v) => {
    const dettagli = (v.dettagli || '').split('\n').map((r) => r.trim().replace(/[;.,:]+$/, '')).filter(Boolean).map((r, k, a) => r.charAt(0).toLowerCase() + r.slice(1) + (k === a.length - 1 ? '.' : ';'));
    y = spazio(8 + Math.min(dettagli.length, 3) * 4.6, y);
    const titolo = v.descrizione.trim().replace(/\s+/g, ' ').toUpperCase();
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...NERO);
    const righeTitolo = doc.splitTextToSize(titolo, W - 2 * M - (dettagli.length ? 25 : 0)) as string[];
    doc.text(righeTitolo, M, y);
    y += (righeTitolo.length - 1) * 4.6;
    // somma carattere per carattere: getTextWidth applica il kerning che il PDF non usa
    const larghezza = [...righeTitolo[righeTitolo.length - 1]].reduce((s, c) => s + doc.getTextWidth(c), 0);
    if (dettagli.length) doc.setFont('helvetica', 'normal').setFontSize(9).text('consistente in:', M + larghezza + 1.8, y);
    y += 5.5;
    doc.setFont('helvetica', 'italic').setFontSize(8.8);
    dettagli.forEach((d) => {
      const righe = doc.splitTextToSize(d, W - 2 * M - 8);
      y = spazio(righe.length * 4.3, y);
      doc.setFillColor(...NERO).triangle(M + 1.2, y - 1.9, M + 1.2, y - 0.5, M + 2.4, y - 1.2, 'F');
      doc.text(righe, M + 7, y);
      y += righe.length * 4.3 + 0.6;
    });
    y += 4;
  });

  // Tabella importi (circa 40 mm): resta sotto le prestazioni se ci sta, altrimenti va alla pagina dopo
  y = spazio(42, y + 4);
  const conSconto = t.scontoImporto > 0;
  const righeTab = [
    ['Onorario', importo(t.onorarioLordo), importo(t.scontoImporto), importo(t.onorario)],
    [`C.I.P.A.G. ${t.percentualeCassa}%`, importo(t.cassaLorda), importo(t.scontoCassa), importo(t.cassa)],
    ['Spese anticipate per Vs conto', importo(t.spese), '-', importo(t.spese)],
    ['Imposta di bollo', importo(t.bollo), '-', importo(t.bollo)],
  ].map((r) => (conSconto ? r : [r[0], '', r[3]]));
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [conSconto ? ['DESCRIZIONE', 'PREZZO UNITARIO', 'SCONTO', 'IMPORTO NETTO'] : ['DESCRIZIONE', '', 'IMPORTO NETTO']],
    body: righeTab,
    theme: 'plain',
    headStyles: { fillColor: NERO, textColor: 255, fontStyle: 'italic', fontSize: 9, halign: 'center', cellPadding: 0.9 },
    bodyStyles: { fontStyle: 'italic', fontSize: 9.5, textColor: NERO, halign: 'center', cellPadding: 1.3 },
    columnStyles: conSconto ? { 0: { cellWidth: 52 }, 1: { cellWidth: 42 }, 2: { cellWidth: 40 } } : { 0: { cellWidth: 52 }, 1: { cellWidth: 82 } },
  });
  const colonne = [52, 42, 40];
  const xUltima = M + colonne.reduce((a, b) => a + b, 0);
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  doc.setLineWidth(0.3).setDrawColor(...NERO).rect(M, y, W - 2 * M, 5.8);
  doc.setFont('helvetica', 'bolditalic').setFontSize(10.5).text('TOTALE PRESTAZIONE', M + colonne[0] / 2, y + 4.1, { align: 'center' });
  doc.setFontSize(12).text(`${importo(t.totale)} \u20ac`, (xUltima + W - M) / 2, y + 4.3, { align: 'center' });
  y += 15;

  doc.setFont('helvetica', 'italic').setFontSize(8.8);
  const note = normalizzaPreventivo(p).note.split('\n').map((r) => r.trim()).filter((r) => r.replace(/^-\s*/, '')).map((r) => {
    const sotto = r.startsWith('-');
    const x = sotto ? M + 18 : M + 8;
    return { sotto, x, righe: doc.splitTextToSize(sotto ? r.replace(/^-\s*/, '') : r, W - M - x) as string[] };
  });
  y = spazio(note.reduce((h, n) => h + n.righe.length * 4.2 + 0.8, 0), y);
  note.forEach(({ sotto, x, righe }) => {
    if (sotto) doc.text('-', x - 5, y);
    else doc.setFillColor(...NERO).rect(x - 5, y - 1.72, 1.2, 1.2, 'F');
    doc.text(righe, x, y);
    y += righe.length * 4.2 + 0.8;
  });

  const firme = Math.max(1, nomi.length);
  y = spazio(48 + (firme - 1) * 12, y + 10);
  doc.setFont('helvetica', 'bold').setFontSize(10.5).text('FIRMA PER ACCETTAZIONE', W / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal').setFontSize(10);
  doc.text(firme > 1 ? 'I committenti' : 'Il committente', 65, y + 14, { align: 'center' });
  doc.text('Il professionista', 145, y + 14, { align: 'center' });
  if (firmaDigitale) {
    doc.setFontSize(9.5).text('F.to digitalmente', 145, y + 30, { align: 'center' });
    doc.setFont('helvetica', 'bold').setFontSize(9).text(studio().firma, 145, y + 34.5, { align: 'center' });
  }
  doc.setLineWidth(0.15);
  if (!firmaDigitale) doc.line(116, y + 36, 174, y + 36);
  for (let i = 0; i < firme; i++) doc.line(36, y + 36 + i * 12, 94, y + 36 + i * 12);

  piede();
  doc.save(`${nomeFilePreventivo(p.cliente)}.pdf`);
};
