import React, { useState } from 'react';

const formatta = (v: number) => (v ? new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : '');

interface Props {
  valore: number;
  onChange: (v: number) => void;
  className?: string;
  testId: string;
}

// Importo in formato italiano (70,00): libero mentre si scrive, formattato all'uscita
export const ImportoInput: React.FC<Props> = ({ valore, onChange, className = '', testId }) => {
  const [testo, setTesto] = useState<string | null>(null);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={testo ?? formatta(valore)}
      onFocus={() => setTesto(valore ? String(valore).replace('.', ',') : '')}
      onChange={(e) => {
        setTesto(e.target.value);
        onChange(parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0);
      }}
      onBlur={() => setTesto(null)}
      placeholder="0,00"
      className={className}
      data-testid={testId}
    />
  );
};
