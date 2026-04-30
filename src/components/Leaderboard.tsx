import { useState, useMemo } from 'react';
import { Trophy, ChevronDown, Medal } from 'lucide-react';
import type { GroupedPlayer, PlayerStats } from '../types';

interface Props {
  players: GroupedPlayer[];
}

interface StatDef {
  key: keyof PlayerStats;
  label: string;
  format: (val: number) => string;
  inverted?: boolean;
}

const LEADERBOARD_STATS: StatDef[] = [
  { key: 'kills', label: 'Kills', format: (v) => v.toFixed(0) },
  { key: 'finalRating', label: 'Final Rating', format: (v) => v.toFixed(3) },
  { key: 'hltvRating', label: 'HLTV Rating', format: (v) => v.toFixed(3) },
  { key: 'adr', label: 'ADR', format: (v) => v.toFixed(1) },
  { key: 'kpr', label: 'KPR', format: (v) => v.toFixed(3) },
  { key: 'dpr', label: 'DPR', format: (v) => v.toFixed(3), inverted: true },
  { key: 'kast', label: 'KAST', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'headshotPct', label: 'Headshot %', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'survival', label: 'Survival', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'openingKillsPerRound', label: 'Opening Kills/Rd', format: (v) => v.toFixed(3) },
  { key: 'openingSuccessPct', label: 'Opening Success %', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'clutchPointsPerRound', label: 'Clutch Points/Rd', format: (v) => v.toFixed(4) },
  { key: 'clutch1v1WinPct', label: '1v1 Clutch Win %', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'tradeKillsPerRound', label: 'Trade Kills/Rd', format: (v) => v.toFixed(3) },
  { key: 'tradedDeathsPct', label: 'Traded Deaths %', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'awpKillsPerRound', label: 'AWP Kills/Rd', format: (v) => v.toFixed(3) },
  { key: 'utilityDamagePerRound', label: 'Utility Dmg/Rd', format: (v) => v.toFixed(2) },
  { key: 'flashAssistsPerRound', label: 'Flash Assists/Rd', format: (v) => v.toFixed(3) },
  { key: 'assistsPerRound', label: 'Assists/Rd', format: (v) => v.toFixed(3) },
  { key: 'supportRoundsPct', label: 'Support Rounds %', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'roundsWithMultiKillPct', label: 'Multi-Kill Rounds %', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'duelSwingPerRound', label: 'Duel Swing/Rd', format: (v) => v.toFixed(4) },
  { key: 'probabilitySwingPerRound', label: 'Prob Swing/Rd', format: (v) => v.toFixed(4) },
  { key: 'pistolRoundRating', label: 'Pistol Rating', format: (v) => v.toFixed(3) },
  { key: 'tRating', label: 'T Rating', format: (v) => v.toFixed(3) },
  { key: 'ctRating', label: 'CT Rating', format: (v) => v.toFixed(3) },
  { key: 'damagePerKill', label: 'Damage/Kill', format: (v) => v.toFixed(1) },
  { key: 'avgTimeToKill', label: 'Avg TTK', format: (v) => `${v.toFixed(2)}s`, inverted: true },
];

const TOP_OPTIONS = [3, 5, 10, 15, 20, 25];
const MIN_GAMES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Leaderboard({ players }: Props) {
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [topCount, setTopCount] = useState<number>(5);
  const [minGames, setMinGames] = useState<number>(1);

  const tiers = useMemo(() => {
    const tierSet = new Set<string>();
    players.forEach((p) => {
      if (p.cscTier) tierSet.add(p.cscTier);
    });
    return ['All', ...Array.from(tierSet).sort()];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const result: { name: string; steamId: string; stats: PlayerStats }[] = [];
    players.forEach((p) => {
      if (selectedTier !== 'All' && p.cscTier !== selectedTier) return;
      if (p.regulation) {
        const stats = p.regulation;
        if (stats.games < minGames) return;
        result.push({
          name: p.name,
          steamId: p.steamId,
          stats,
        });
      }
    });
    return result;
  }, [players, selectedTier, minGames]);

  const getLeaderboard = (stat: StatDef) => {
    const sorted = [...filteredPlayers].sort((a, b) => {
      const aVal = a.stats[stat.key] as number;
      const bVal = b.stats[stat.key] as number;
      return stat.inverted ? aVal - bVal : bVal - aVal;
    });
    return sorted.slice(0, topCount);
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-slate-300';
    if (index === 2) return 'text-amber-600';
    return 'text-slate-500';
  };

  const getMedalBg = (index: number) => {
    if (index === 0) return 'bg-yellow-400/10 border-yellow-400/30';
    if (index === 1) return 'bg-slate-300/10 border-slate-300/30';
    if (index === 2) return 'bg-amber-600/10 border-amber-600/30';
    return 'bg-white/5 border-white/10';
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border border-yellow-400/30">
            <Trophy size={24} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Leaderboards</h1>
            <p className="text-sm text-slate-400">Top performers across all stats</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Tier Dropdown */}
          <div className="relative">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="appearance-none glass rounded-lg px-4 py-2 pr-10 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer bg-transparent"
            >
              {tiers.map((tier) => (
                <option key={tier} value={tier} className="bg-dark-800 text-slate-200">
                  {tier === 'All' ? 'All Tiers' : tier}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Top N Dropdown */}
          <div className="relative">
            <select
              value={topCount}
              onChange={(e) => setTopCount(Number(e.target.value))}
              className="appearance-none glass rounded-lg px-4 py-2 pr-10 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer bg-transparent"
            >
              {TOP_OPTIONS.map((n) => (
                <option key={n} value={n} className="bg-dark-800 text-slate-200">
                  Top {n}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Min Games Dropdown */}
          <div className="relative">
            <select
              value={minGames}
              onChange={(e) => setMinGames(Number(e.target.value))}
              className="appearance-none glass rounded-lg px-4 py-2 pr-10 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer bg-transparent"
            >
              {MIN_GAMES_OPTIONS.map((n) => (
                <option key={n} value={n} className="bg-dark-800 text-slate-200">
                  Min {n} game{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Stats count */}
      <div className="text-sm text-slate-400">
        Showing top {topCount} players from {filteredPlayers.length} {selectedTier === 'All' ? 'total' : selectedTier} players
      </div>

      {/* Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {LEADERBOARD_STATS.map((stat) => {
          const leaders = getLeaderboard(stat);
          return (
            <div key={stat.key} className="glass rounded-xl p-4 card-glow">
              <h3 className="text-sm font-semibold text-neon-blue mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neon-blue to-neon-purple rounded-full"></span>
                {stat.label}
                {stat.inverted && <span className="text-xs text-slate-500">(lower is better)</span>}
              </h3>
              <div className="space-y-2">
                {leaders.map((player, idx) => (
                  <div
                    key={player.steamId}
                    className={`flex items-center gap-3 p-2 rounded-lg border ${getMedalBg(idx)} transition-colors`}
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full ${getMedalColor(idx)}`}>
                      {idx < 3 ? (
                        <Medal size={16} />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{player.name}</div>
                    </div>
                    <div className={`text-sm font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {stat.format(player.stats[stat.key] as number)}
                    </div>
                  </div>
                ))}
                {leaders.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-2">No data</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
