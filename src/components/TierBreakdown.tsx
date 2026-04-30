import type { PlayerTierBreakdown } from '../types';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const TIER_HEX: string[] = [
  '#00d4ff',
  '#a855f7',
  '#34d399',
  '#facc15',
  '#00fff2',
  '#f87171',
  '#fb923c',
  '#f472b6',
  '#ec4899',
  '#94a3b8',
];

interface Props {
  tierBreakdown: PlayerTierBreakdown;
}

function colorHex(i: number): string {
  return TIER_HEX[i % TIER_HEX.length];
}

export default function TierBreakdown({ tierBreakdown }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!tierBreakdown.matches.length) return null;

  return (
    <div className="glass rounded-xl p-6 card-glow group">
      <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-neon-purple to-neon-pink rounded-full"></span>
        <Layers size={18} className="opacity-80" /> Tier Breakdown
        {' · '}
        <span className="text-sm font-normal text-slate-400">
          {tierBreakdown.totalPlayers} players across {tierBreakdown.matches.length} game{tierBreakdown.matches.length !== 1 ? 's' : ''}
        </span>
      </h3>

      {/* Overall bars */}
      <div className="space-y-3 mb-6">
        {tierBreakdown.overall.map((tb, i) => {
          const hex = colorHex(i);
          return (
            <div key={tb.tier}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300 font-medium">{tb.tier}</span>
                <span className="text-slate-400">
                  {tb.count} ({(tb.pct * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-dark-600 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 opacity-80"
                  style={{
                    width: `${Math.max(tb.pct * 100, 2)}%`,
                    background: `linear-gradient(90deg, ${hex}, ${hex}88)`,
                    boxShadow: `0 0 8px ${hex}66`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-match breakdown toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-neon-blue transition-colors cursor-pointer"
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Per-match breakdown
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {tierBreakdown.matches.map((match, mi) => {
            const borderHex = colorHex(mi);
            return (
              <div
                key={match.matchId}
                className="rounded-lg p-4 bg-dark-900/30"
                style={{ border: `1px solid ${borderHex}33` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-mono text-slate-500">{match.matchId}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-dark-600 text-slate-300">
                    {match.teamA}
                  </span>
                  <span className="text-xs text-slate-500">vs</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-dark-600 text-slate-300">
                    {match.teamB}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {match.tierBreakdown.map((tb, i) => {
                    const hex = colorHex(i);
                    return (
                      <div
                        key={tb.tier}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                        style={{
                          background: `${hex}22`,
                          border: `1px solid ${hex}33`,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full opacity-70"
                          style={{ background: hex }}
                        />
                        <span className="text-slate-300">{tb.tier}</span>
                        <span className="text-slate-500">{tb.count} ({(tb.pct * 100).toFixed(0)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
