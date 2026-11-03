import { ChevronDown } from 'lucide-react';

interface FiltroSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  testId: string;
}

// Menu a tendina compatto per la riga filtri delle tabelle
export const FiltroSelect = ({ value, onChange, options, testId }: FiltroSelectProps) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-w-[96px] text-xs pl-1.5 py-1.5 border border-ink-300 rounded-md bg-white text-ink-700 appearance-none pr-5 focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500"
      data-testid={testId}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <ChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-ink-400 pointer-events-none" />
  </div>
);
