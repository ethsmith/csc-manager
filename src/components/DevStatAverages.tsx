import { useMemo } from 'react';
import type { GroupedPlayer, PlayerStats } from '../types';
import { Calculator, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  players: GroupedPlayer[];
}

type StatKey = keyof Omit<PlayerStats, 'steamId' | 'name' | 'tier'>;

const statKeys: StatKey[] = [
  'games', 'finalRating', 'hltvRating', 'roundsPlayed', 'roundsWon', 'roundsLost',
  'kills', 'assists', 'deaths', 'damage', 'adr', 'kpr', 'dpr', 'kast', 'survival',
  'headshots', 'headshotPct', 'avgTimeToKill', 'openingKills', 'openingDeaths',
  'openingAttempts', 'openingSuccesses', 'openingKillsPerRound', 'openingDeathsPerRound',
  'openingAttemptsPct', 'openingSuccessPct', 'roundsWonAfterOpening', 'winPctAfterOpeningKill',
  'ecoKillValue', 'ecoDeathValue', 'duelSwing', 'duelSwingPerRound', 'econImpact', 'roundImpact', 'probabilitySwing',
  'probabilitySwingPerRound', 'clutchRounds', 'clutchWins', 'clutchPointsPerRound',
  'clutch1v1Attempts', 'clutch1v1Wins', 'clutch1v1WinPct', 'tradeKills', 'tradeKillsPerRound',
  'tradeKillsPct', 'fastTrades', 'tradedDeaths', 'tradedDeathsPerRound', 'tradedDeathsPct',
  'tradeDenials', 'savedByTeammate', 'savedByTeammatePerRound', 'savedTeammate',
  'savedTeammatePerRound', 'openingDeathsTraded', 'openingDeathsTradedPct', 'awpKills',
  'awpKillsPerRound', 'awpKillsPct', 'roundsWithAwpKill', 'roundsWithAwpKillPct',
  'awpMultiKillRounds', 'awpMultiKillRoundsPerRound', 'awpOpeningKills', 'awpOpeningKillsPerRound',
  'awpDeaths', 'awpDeathsNoKill', 'oneK', 'twoK', 'threeK', 'fourK', 'fiveK',
  'roundsWithKill', 'roundsWithKillPct', 'roundsWithMultiKill', 'roundsWithMultiKillPct',
  'killsInWonRounds', 'killsPerRoundWin', 'damageInWonRounds', 'damagePerRoundWin',
  'perfectKills', 'damagePerKill', 'knifeKills', 'pistolVsRifleKills', 'supportRounds',
  'supportRoundsPct', 'assistedKills', 'assistedKillsPct', 'assistsPerRound', 'attackRounds',
  'attacksPerRound', 'timeAlivePerRound', 'lastAliveRounds', 'lastAlivePct', 'savesOnLoss',
  'savesPerRoundLoss', 'utilityDamage', 'utilityDamagePerRound', 'utilityKills',
  'utilityKillsPer100Rounds', 'flashesThrown', 'flashesThrownPerRound', 'flashAssists',
  'flashAssistsPerRound', 'enemyFlashDurationPerRound', 'teamFlashCount',
  'teamFlashDurationPerRound', 'exitFrags', 'earlyDeaths', 'manAdvantageKills',
  'manAdvantageKillsPct', 'manDisadvantageDeaths', 'manDisadvantageDeathsPct', 'lowBuyKills',
  'lowBuyKillsPct', 'disadvantagedBuyKills', 'disadvantagedBuyKillsPct', 'pistolRoundsPlayed',
  'pistolRoundKills', 'pistolRoundDeaths', 'pistolRoundDamage', 'pistolRoundsWon',
  'pistolRoundSurvivals', 'pistolRoundMultiKills', 'pistolRoundRating', 'tRoundsPlayed',
  'tKills', 'tDeaths', 'tDamage', 'tSurvivals', 'tRoundsWithMultiKill', 'tEcoKillValue',
  'tKast', 'tClutchRounds', 'tClutchWins', 'tManAdvantageKills', 'tManAdvantageKillsPct',
  'tManDisadvantageDeaths', 'tManDisadvantageDeathsPct', 'tRating', 'tEcoRating',
  'ctRoundsPlayed', 'ctKills', 'ctDeaths', 'ctDamage', 'ctSurvivals', 'ctRoundsWithMultiKill',
  'ctEcoKillValue', 'ctKast', 'ctClutchRounds', 'ctClutchWins', 'ctManAdvantageKills',
  'ctManAdvantageKillsPct', 'ctManDisadvantageDeaths', 'ctManDisadvantageDeathsPct',
  'ctRating', 'ctEcoRating', 'ancientRating', 'ancientGames', 'anubisRating', 'anubisGames',
  'dust2Rating', 'dust2Games', 'infernoRating', 'infernoGames', 'mirageRating', 'mirageGames',
  'nukeRating', 'nukeGames', 'overpassRating', 'overpassGames',
];

interface StatAverage {
  key: StatKey;
  average: number;
  median: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  count: number;
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
}

export default function DevStatAverages({ players }: Props) {
  const [copied, setCopied] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [minGames, setMinGames] = useState<number>(0);

  const tiers = useMemo(() => {
    const tierSet = new Set<string>();
    players.forEach(p => {
      if (p.cscTier) tierSet.add(p.cscTier);
    });
    return Array.from(tierSet).sort();
  }, [players]);

  const statAverages = useMemo(() => {
    const allStats: PlayerStats[] = [];
    
    players.forEach(p => {
      // Filter by tier if selected
      if (tierFilter !== 'all' && p.cscTier !== tierFilter) return;
      
      // Only use regulation stats
      p.regulation.forEach(entry => {
        // Filter by minimum games
        if (entry.stats.games < minGames) return;
        allStats.push(entry.stats);
      });
    });

    if (allStats.length === 0) return [];

    const averages: StatAverage[] = statKeys.map(key => {
      const values = allStats.map(s => s[key]).filter(v => v !== 0 && !isNaN(v));
      const sortedValues = [...values].sort((a, b) => a - b);
      
      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = values.length > 0 ? sum / values.length : 0;
      
      return {
        key,
        average: avg,
        median: calculatePercentile(sortedValues, 50),
        min: sortedValues[0] ?? 0,
        max: sortedValues[sortedValues.length - 1] ?? 0,
        p25: calculatePercentile(sortedValues, 25),
        p50: calculatePercentile(sortedValues, 50),
        p75: calculatePercentile(sortedValues, 75),
        p90: calculatePercentile(sortedValues, 90),
        count: values.length,
      };
    });

    return averages;
  }, [players, tierFilter, minGames]);

  const copyableText = useMemo(() => {
    const lines = statAverages.map(s => 
      `${s.key}: avg=${s.average.toFixed(4)}, median=${s.median.toFixed(4)}, p25=${s.p25.toFixed(4)}, p50=${s.p50.toFixed(4)}, p75=${s.p75.toFixed(4)}, p90=${s.p90.toFixed(4)}, min=${s.min.toFixed(4)}, max=${s.max.toFixed(4)}, count=${s.count}`
    );
    return lines.join('\n');
  }, [statAverages]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <Calculator size={24} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Stat Averages (Dev)</h1>
            <p className="text-slate-400 text-sm">
              {statAverages.length > 0 ? `${statAverages[0].count} players analyzed` : 'Loading...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="minGames" className="text-slate-400 text-sm">Min Games:</label>
            <input
              id="minGames"
              type="number"
              min="0"
              value={minGames}
              onChange={(e) => setMinGames(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 px-3 py-2 rounded-lg glass border border-slate-600 text-slate-200 bg-transparent"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 rounded-lg glass border border-slate-600 text-slate-200 bg-transparent cursor-pointer"
          >
            <option value="all">All Tiers</option>
            {tiers.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors cursor-pointer"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy All'}
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Stat</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Average</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Median</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">P25</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">P50</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">P75</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">P90</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Min</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Max</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {statAverages.map((stat, idx) => (
                <tr 
                  key={stat.key}
                  className={`border-b border-slate-700/50 hover:bg-white/5 ${idx % 2 === 0 ? 'bg-slate-800/20' : ''}`}
                >
                  <td className="px-4 py-2 text-slate-200 font-mono">{stat.key}</td>
                  <td className="px-4 py-2 text-right text-neon-blue font-mono">{stat.average.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-emerald-400 font-mono">{stat.median.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-slate-400 font-mono">{stat.p25.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-cyan-400 font-mono">{stat.p50.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-slate-400 font-mono">{stat.p75.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-yellow-400 font-mono">{stat.p90.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-red-400 font-mono">{stat.min.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-purple-400 font-mono">{stat.max.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{stat.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
