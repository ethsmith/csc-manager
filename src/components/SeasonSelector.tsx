import { Calendar } from 'lucide-react';

interface Props {
  season: number;
  onChange: (season: number) => void;
}

const SEASONS = [19, 20];

export default function SeasonSelector({ season, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Calendar size={16} className="text-slate-400" />
      <select
        value={season}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none glass rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer bg-transparent"
      >
        {SEASONS.map((s) => (
          <option key={s} value={s} className="bg-dark-800 text-slate-200">
            Season {s}
          </option>
        ))}
      </select>
    </div>
  );
}
