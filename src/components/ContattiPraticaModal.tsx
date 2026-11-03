import React from 'react';
import { User, Phone, Mail, MapPin, X } from 'lucide-react';

interface PraticaContatti {
  committente?: string | null;
  proprieta?: string | null;
  telefono?: string | null;
  mail?: string | null;
  proprieta2?: string | null;
  telefono2?: string | null;
  mail2?: string | null;
  indirizzo?: string | null;
  citta?: string | null;
}

const valore = (v?: string | null) => (v && v.trim() && v.trim() !== '-' ? v.trim() : null);

const Riga: React.FC<{ Icona: typeof Phone; v: string | null; href?: string; testId: string }> = ({ Icona, v, href, testId }) => (
  <div className="flex items-center gap-2.5 text-sm" data-testid={testId}>
    <Icona className="h-4 w-4 shrink-0 text-ink-400" />
    {v ? (href ? <a href={href} className="text-ink-800 underline decoration-ink-200 underline-offset-2 hover:decoration-ink-600">{v}</a> : <span className="text-ink-800">{v}</span>) : <span className="text-ink-300">Non indicato</span>}
  </div>
);

const Scheda: React.FC<{ titolo: string; nome: string; tel: string | null; mail: string | null; testId: string }> = ({ titolo, nome, tel, mail, testId }) => (
  <div className="flex-1 rounded-lg border border-ink-100 p-4" data-testid={testId}>
    <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{titolo}</div>
    <div className="mt-1 flex items-center gap-2 text-base font-semibold text-ink-900"><User className="h-4 w-4 text-ink-400" />{nome}</div>
    <div className="mt-3 space-y-2">
      <Riga Icona={Phone} v={tel} href={tel ? `tel:${tel.replace(/\s+/g, '')}` : undefined} testId={`${testId}-telefono`} />
      <Riga Icona={Mail} v={mail} href={mail ? `mailto:${mail}` : undefined} testId={`${testId}-email`} />
    </div>
  </div>
);

// Finestra Contatto dal tasto destro: una scheda per Proprietario 1 e, se presente, una per Proprietario 2
export const ContattiPraticaModal: React.FC<{ pratica: PraticaContatti; onClose: () => void }> = ({ pratica, onClose }) => {
  const secondo = valore(pratica.proprieta2);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} data-testid="contatti-pratica-modal">
      <div className={`w-full ${secondo ? 'max-w-2xl' : 'max-w-md'} rounded-xl bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-ink-900">Contatti{valore(pratica.committente) ? ` \u00b7 ${pratica.committente}` : ''}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700" data-testid="contatti-pratica-chiudi"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Scheda titolo="Proprietario 1" nome={valore(pratica.proprieta) || '-'} tel={valore(pratica.telefono)} mail={valore(pratica.mail)} testId="contatto-proprietario-1" />
            {secondo && <Scheda titolo="Proprietario 2" nome={secondo} tel={valore(pratica.telefono2)} mail={valore(pratica.mail2)} testId="contatto-proprietario-2" />}
          </div>
          <Riga Icona={MapPin} v={[valore(pratica.indirizzo), valore(pratica.citta)].filter(Boolean).join(', ') || null} testId="contatti-pratica-indirizzo" />
        </div>
      </div>
    </div>
  );
};
