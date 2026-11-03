import React, { useEffect } from 'react';
import { Users } from 'lucide-react';
import { RubricaAutocomplete } from './RubricaAutocomplete';
import type { Rubrica } from '../types';

export interface ContattiValori {
  proprieta: string;
  proprieta2: string;
  telefono: string;
  telefono2: string;
  mail: string;
  mail2: string;
}

export interface RubricaFlags {
  p1: boolean;
  p2: boolean;
}

export const RUBRICA_DEFAULT: RubricaFlags = { p1: false, p2: false };

interface ContattiPraticaProps {
  valori: ContattiValori;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPatch: (patch: Partial<ContattiValori>) => void;
  rubrica: RubricaFlags;
  onRubricaChange: (flags: RubricaFlags) => void;
  className?: string;
}

const etichetta = 'block text-sm font-medium text-ink-700 mb-1';

const Campo: React.FC<{ label: string; name: keyof ContattiValori; type: string; value: string; placeholder: string; onChange: ContattiPraticaProps['onInputChange'] }> = ({ label, name, type, value, placeholder, onChange }) => (
  <div>
    <label className={etichetta}>{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="input w-full" data-testid={`contatti-${name}-input`} />
  </div>
);

export const ContattiPratica: React.FC<ContattiPraticaProps> = ({ valori, onInputChange, onPatch, rubrica, onRubricaChange, className = '' }) => {
  useEffect(() => {
    onRubricaChange(RUBRICA_DEFAULT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const riga = (n: 1 | 2) => {
    const nome = n === 1 ? 'proprieta' : 'proprieta2';
    const tel = n === 1 ? 'telefono' : 'telefono2';
    const mail = n === 1 ? 'mail' : 'mail2';
    const flag = n === 1 ? 'p1' : 'p2';
    return (
      <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid={`contatti-riga-${n}`}>
        <div>
          <label className={etichetta}>Proprietario {n}{n === 1 ? ' *' : ''}</label>
          <RubricaAutocomplete
            value={valori[nome]}
            onChange={(val) => onPatch({ [nome]: val })}
            onSelect={(c: Rubrica) => onPatch({ [nome]: c.nominativo, [tel]: c.telefono || '', [mail]: c.email || '' })}
            placeholder={n === 1 ? 'Nome proprietario' : 'Nome secondo proprietario'}
          />
        </div>
        <Campo label={`Telefono ${n}`} name={tel} type="tel" value={valori[tel]} placeholder="XXX XXX XXXX" onChange={onInputChange} />
        <Campo label={`Email ${n}`} name={mail} type="email" value={valori[mail]} placeholder="email@esempio.com" onChange={onInputChange} />
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-ink-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={rubrica[flag]}
          onChange={(e) => onRubricaChange({ ...rubrica, [flag]: e.target.checked })}
          className="w-4 h-4 accent-ink-800"
          data-testid={`contatti-rubrica-${n}-checkbox`}
        />
        Aggiungi Proprietario {n} in rubrica
      </label>
      </div>
    );
  };

  return (
    <div className={`rounded-md border border-ink-200 bg-ink-50 p-4 space-y-4 ${className}`} data-testid="contatti-pratica">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
        <Users className="w-4 h-4" />
        Proprietari e contatti
      </div>
      {riga(1)}
      {riga(2)}
    </div>
  );
};
