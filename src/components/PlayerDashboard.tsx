import { useState, useMemo } from 'react';
import {
  Crosshair,
  Skull,
  Heart,
  Target,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Award,
  Flame,
  Eye,
} from 'lucide-react';
import type { PlayerStats, GroupedPlayer, StatMode, StatEntry } from '../types';
import StatCard from './StatCard';
import PerformanceRadar from './RadarChart';
import KillDistribution from './KillDistribution';
import SideComparison from './SideComparison';
import MapRatings from './MapRatings';
import ModeToggle from './ModeToggle';

interface Props {
  groupedPlayer: GroupedPlayer;
  allGroupedPlayers: GroupedPlayer[];
  mode: StatMode;
  onModeChange: (mode: StatMode) => void;
  onBack: () => void;
}

function ratingColor(rating: number): string {
  if (rating >= 1.2) return 'text-emerald-400';
  if (rating >= 1.0) return 'text-neon-blue';
  if (rating >= 0.8) return 'text-yellow-400';
  return 'text-red-400';
}

function kdRatio(kills: number, deaths: number): string {
  if (deaths === 0) return kills.toFixed(2);
  return (kills / deaths).toFixed(2);
}

function pct(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

function getEntries(gp: GroupedPlayer, mode: StatMode): StatEntry[] {
  return mode === 'regulation' ? gp.regulation : gp.scrim;
}

function getAllStatsForMode(allPlayers: GroupedPlayer[], mode: StatMode): PlayerStats[] {
  return allPlayers.flatMap((gp) => getEntries(gp, mode).map((e) => e.stats));
}

export default function PlayerDashboard({ groupedPlayer, allGroupedPlayers, mode, onModeChange, onBack }: Props) {
  const entries = getEntries(groupedPlayer, mode);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const safeIdx = Math.min(selectedIdx, entries.length - 1);
  const entry = entries[safeIdx] ?? entries[0];

  const allPlayers = useMemo(
    () => getAllStatsForMode(allGroupedPlayers, mode),
    [allGroupedPlayers, mode]
  );

  if (!entry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onBack}
            className="glass rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-neon-blue transition-colors neon-border-hover cursor-pointer"
          >
            ← Back
          </button>
          <ModeToggle mode={mode} onChange={onModeChange} />
        </div>
        <div className="glass rounded-xl p-12 card-glow text-center">
          <p className="text-slate-400 text-lg">
            No {mode} stats available for <span className="text-neon-blue font-semibold">{groupedPlayer.name}</span>
          </p>
          <button
            onClick={() => onModeChange(mode === 'regulation' ? 'scrim' : 'regulation')}
            className="mt-4 px-6 py-2 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors cursor-pointer"
          >
            Switch to {mode === 'regulation' ? 'Scrims' : 'Regulation'}
          </button>
        </div>
      </div>
    );
  }

  const player = entry.stats;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="glass rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-neon-blue transition-colors neon-border-hover cursor-pointer"
        >
          ← Back
        </button>
        <ModeToggle mode={mode} onChange={(m) => { onModeChange(m); setSelectedIdx(0); }} />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold neon-glow truncate">{groupedPlayer.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-sm px-3 py-0.5 rounded-full border ${
              mode === 'scrim'
                ? 'bg-neon-purple/10 text-neon-purple border-neon-purple/20'
                : 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'
            }`}>
              {entry.tier}
            </span>
            <span className="text-sm text-slate-400">
              {player.games} game{player.games !== 1 ? 's' : ''} · {player.roundsPlayed} rounds
            </span>
            {mode === 'scrim' && player.name !== groupedPlayer.name && (
              <span className="text-sm text-slate-500 italic">
                alias: {player.name}
              </span>
            )}
          </div>
          {/* Entry selector if multiple entries in this mode */}
          {entries.length > 1 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {entries.map((e, i) => (
                <button
                  key={`${e.tier}-${i}`}
                  onClick={() => setSelectedIdx(i)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    i === safeIdx
                      ? mode === 'scrim'
                        ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'
                        : 'bg-neon-blue/20 text-neon-blue border-neon-blue/30'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {e.tier} ({e.stats.games}g)
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-slate-400">Final Rating</div>
          <div className={`text-4xl font-black ${ratingColor(player.finalRating)}`}>
            {player.finalRating.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Core Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard label="K / D / A" value={`${player.kills} / ${player.deaths} / ${player.assists}`} icon={<Crosshair size={16} />} />
        <StatCard label="K/D Ratio" value={kdRatio(player.kills, player.deaths)} icon={<Target size={16} />} color={parseFloat(kdRatio(player.kills, player.deaths)) >= 1 ? 'text-emerald-400' : 'text-red-400'} />
        <StatCard label="ADR" value={player.adr.toFixed(1)} icon={<Flame size={16} />} color={player.adr >= 80 ? 'text-emerald-400' : player.adr >= 60 ? 'text-neon-blue' : 'text-yellow-400'} />
        <StatCard label="HLTV Rating" value={player.hltvRating.toFixed(3)} icon={<TrendingUp size={16} />} color={ratingColor(player.hltvRating + 0.5)} />
        <StatCard label="KAST" value={pct(player.kast)} icon={<Shield size={16} />} color={player.kast >= 0.7 ? 'text-emerald-400' : 'text-neon-blue'} />
        <StatCard label="Headshot %" value={pct(player.headshotPct)} icon={<Skull size={16} />} />
        <StatCard label="KPR" value={player.kpr.toFixed(3)} icon={<Crosshair size={16} />} />
        <StatCard label="DPR" value={player.dpr.toFixed(3)} icon={<Skull size={16} />} color="text-red-400" />
        <StatCard label="Survival" value={pct(player.survival)} icon={<Heart size={16} />} color="text-emerald-400" />
        <StatCard label="Avg TTK" value={`${player.avgTimeToKill.toFixed(2)}s`} icon={<Clock size={16} />} />
        <StatCard label="Damage/Kill" value={player.damagePerKill.toFixed(1)} icon={<Zap size={16} />} />
        <StatCard label="Time Alive/Rd" value={`${player.timeAlivePerRound.toFixed(1)}s`} icon={<Clock size={16} />} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceRadar player={player} allPlayers={allPlayers} />
        <KillDistribution player={player} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SideComparison player={player} />
        <MapRatings player={player} />
      </div>

      {/* Opening Duels & Clutch Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opening Duels */}
        <div className="glass rounded-xl p-6 card-glow">
          <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <Zap size={18} /> Opening Duels
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Opening Kills</div>
              <div className="text-2xl font-bold text-emerald-400">{player.openingKills}</div>
              <div className="text-xs text-slate-500">{player.openingKillsPerRound.toFixed(3)} per round</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Opening Deaths</div>
              <div className="text-2xl font-bold text-red-400">{player.openingDeaths}</div>
              <div className="text-xs text-slate-500">{player.openingDeathsPerRound.toFixed(3)} per round</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Success Rate</div>
              <div className="text-2xl font-bold text-neon-blue">{pct(player.openingSuccessPct)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Win After Entry</div>
              <div className="text-2xl font-bold text-neon-cyan">{pct(player.winPctAfterOpeningKill)}</div>
            </div>
          </div>
          {/* Opening duel bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Opening Kill Rate</span>
              <span>{player.openingKills} / {player.openingAttempts}</span>
            </div>
            <div className="h-2 rounded-full bg-dark-600 overflow-hidden">
              <div
                className="h-full stat-bar rounded-full transition-all duration-700"
                style={{
                  width: `${player.openingAttempts > 0 ? (player.openingKills / player.openingAttempts) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Clutch & Trading */}
        <div className="glass rounded-xl p-6 card-glow">
          <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <Award size={18} /> Clutch & Trading
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Clutch Wins</div>
              <div className="text-2xl font-bold text-neon-purple">{player.clutchWins}/{player.clutchRounds}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">1v1 Clutch</div>
              <div className="text-2xl font-bold text-neon-purple">
                {player.clutch1v1Wins}/{player.clutch1v1Attempts}
                {player.clutch1v1Attempts > 0 && (
                  <span className="text-sm ml-1 text-slate-400">({pct(player.clutch1v1WinPct)})</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Trade Kills</div>
              <div className="text-2xl font-bold text-emerald-400">{player.tradeKills}</div>
              <div className="text-xs text-slate-500">{player.tradeKillsPerRound.toFixed(3)} per round</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Traded Deaths</div>
              <div className="text-2xl font-bold text-yellow-400">{player.tradedDeaths}</div>
              <div className="text-xs text-slate-500">{pct(player.tradedDeathsPct)} of deaths</div>
            </div>
          </div>
        </div>
      </div>

      {/* AWP & Utility Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AWP Stats */}
        <div className="glass rounded-xl p-6 card-glow">
          <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <Eye size={18} /> AWP Stats
          </h3>
          {player.awpKills > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">AWP Kills</div>
                <div className="text-2xl font-bold text-neon-blue">{player.awpKills}</div>
                <div className="text-xs text-slate-500">{player.awpKillsPerRound.toFixed(3)} per round</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">AWP Kill Rounds</div>
                <div className="text-2xl font-bold text-neon-cyan">{player.roundsWithAwpKill}</div>
                <div className="text-xs text-slate-500">{pct(player.roundsWithAwpKillPct)} of rounds</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">AWP Multi-Kill Rds</div>
                <div className="text-2xl font-bold text-neon-purple">{player.awpMultiKillRounds}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">AWP Opening Kills</div>
                <div className="text-2xl font-bold text-emerald-400">{player.awpOpeningKills}</div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No AWP kills recorded</p>
          )}
        </div>

        {/* Utility */}
        <div className="glass rounded-xl p-6 card-glow">
          <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <Shield size={18} /> Utility Usage
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Util Damage</div>
              <div className="text-2xl font-bold text-neon-blue">{player.utilityDamage}</div>
              <div className="text-xs text-slate-500">{player.utilityDamagePerRound.toFixed(1)} per round</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Util Kills</div>
              <div className="text-2xl font-bold text-neon-cyan">{player.utilityKills}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Flashes Thrown</div>
              <div className="text-2xl font-bold text-yellow-400">{player.flashesThrown}</div>
              <div className="text-xs text-slate-500">{player.flashesThrownPerRound.toFixed(2)} per round</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Flash Assists</div>
              <div className="text-2xl font-bold text-yellow-300">{player.flashAssists}</div>
              <div className="text-xs text-slate-500">{player.enemyFlashDurationPerRound.toFixed(2)}s enemy blind/rd</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pistol Round Stats */}
      <div className="glass rounded-xl p-6 card-glow">
        <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
          <Target size={18} /> Pistol Rounds
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Played</div>
            <div className="text-xl font-bold text-slate-200">{player.pistolRoundsPlayed}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Won</div>
            <div className="text-xl font-bold text-emerald-400">{player.pistolRoundsWon}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Kills</div>
            <div className="text-xl font-bold text-neon-blue">{player.pistolRoundKills}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Deaths</div>
            <div className="text-xl font-bold text-red-400">{player.pistolRoundDeaths}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Damage</div>
            <div className="text-xl font-bold text-neon-cyan">{player.pistolRoundDamage}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Rating</div>
            <div className={`text-xl font-bold ${ratingColor(player.pistolRoundRating)}`}>
              {player.pistolRoundRating.toFixed(3)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
