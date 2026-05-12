import { Swords, FlaskConical } from 'lucide-react';
import type { StatMode } from '../types';

interface Props {
  mode: StatMode;
  onChange: (mode: StatMode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  const Icon = mode === 'combine' ? FlaskConical : Swords;

  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className={mode === 'combine' ? 'text-neon-purple' : 'text-neon-blue'} />
      <select
        aria-label="Stat mode"
        value={mode}
        onChange={(e) => onChange(e.target.value as StatMode)}
        className="appearance-none glass rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer bg-transparent"
      >
        <option value="regulation" className="bg-dark-800 text-slate-200">
          Regulation
        </option>
        <option value="combine" className="bg-dark-800 text-slate-200">
          Combine
        </option>
      </select>
    </div>
  );
}
