import { Swords, Gamepad2 } from 'lucide-react';
import type { StatMode } from '../types';

interface Props {
  mode: StatMode;
  onChange: (mode: StatMode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex rounded-xl overflow-hidden glass neon-border">
      <button
        onClick={() => onChange('regulation')}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
          mode === 'regulation'
            ? 'bg-neon-blue/20 text-neon-blue'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <Swords size={16} />
        Regulation
      </button>
      <button
        onClick={() => onChange('scrim')}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
          mode === 'scrim'
            ? 'bg-neon-purple/20 text-neon-purple'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <Gamepad2 size={16} />
        Scrims
      </button>
    </div>
  );
}
