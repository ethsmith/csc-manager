import { useState } from 'react';
import { Flame, Users, Swords, Zap, Award, Eye, Shield, ChevronDown } from 'lucide-react';
import type { PlayerStats } from '../types';
import { getPercentileColor, getPercentileBgColor } from '../statRanges';

interface StatWithPercentile {
  label: string;
  value: string | number;
  percentile: number;
  inverted?: boolean; // For stats where lower is better (e.g., deaths)
}

interface RatingCardProps {
  title: string;
  icon: React.ReactNode;
  rating: number;
  stats: StatWithPercentile[];
  accentColor: string;
  defaultExpanded?: boolean;
}

function RatingCard({ title, icon, rating, stats, accentColor, defaultExpanded = false }: RatingCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="glass rounded-xl p-4 card-glow">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-1 h-5 ${accentColor} rounded-full`}></span>
            {icon}
            <span className="font-semibold text-slate-200">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className={`text-2xl font-bold ${getPercentileColor(rating)}`}>{rating}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-dark-600 overflow-hidden">
          <div
            className={`h-full ${getPercentileBgColor(rating)} rounded-full transition-all duration-700`}
            style={{ width: `${rating}%` }}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">{stat.label}</span>
                <span className="text-slate-200 font-medium">{stat.value}</span>
              </div>
              <div className="h-1 rounded-full bg-dark-600 overflow-hidden">
                <div
                  className={`h-full ${getPercentileBgColor(stat.percentile)} rounded-full transition-all duration-500`}
                  style={{ width: `${stat.percentile}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function pct(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

// Calculate percentile of a value within an array of values
function calculatePercentile(value: number, allValues: number[], inverted = false): number {
  if (allValues.length === 0) return 50;
  const sorted = [...allValues].sort((a, b) => a - b);
  let rank = sorted.filter((v) => v < value).length;
  const ties = sorted.filter((v) => v === value).length;
  rank += ties / 2;
  let percentile = (rank / sorted.length) * 100;
  if (inverted) percentile = 100 - percentile;
  return Math.round(Math.max(0, Math.min(100, percentile)));
}

// Extract stat values from all tier players
function getStatValues(players: PlayerStats[], getter: (p: PlayerStats) => number): number[] {
  return players.map(getter);
}

interface Props {
  player: PlayerStats;
  tierPlayers: PlayerStats[];
  defaultCollapsed?: boolean;
}

export default function HLTVRatingCards({ player, tierPlayers, defaultCollapsed = true }: Props) {
  // Firepower stats with percentiles
  const firepowerStats: StatWithPercentile[] = [
    {
      label: 'Kills per round',
      value: player.kpr.toFixed(2),
      percentile: calculatePercentile(player.kpr, getStatValues(tierPlayers, (p) => p.kpr)),
    },
    {
      label: 'Kills per round win',
      value: player.killsPerRoundWin.toFixed(2),
      percentile: calculatePercentile(player.killsPerRoundWin, getStatValues(tierPlayers, (p) => p.killsPerRoundWin)),
    },
    {
      label: 'Damage per round',
      value: player.adr.toFixed(1),
      percentile: calculatePercentile(player.adr, getStatValues(tierPlayers, (p) => p.adr)),
    },
    {
      label: 'Damage per round win',
      value: player.damagePerRoundWin.toFixed(1),
      percentile: calculatePercentile(player.damagePerRoundWin, getStatValues(tierPlayers, (p) => p.damagePerRoundWin)),
    },
    {
      label: 'Rounds with a kill',
      value: pct(player.roundsWithKillPct),
      percentile: calculatePercentile(player.roundsWithKillPct, getStatValues(tierPlayers, (p) => p.roundsWithKillPct)),
    },
    {
      label: 'Rating 1.0',
      value: player.hltvRating.toFixed(2),
      percentile: calculatePercentile(player.hltvRating, getStatValues(tierPlayers, (p) => p.hltvRating)),
    },
    {
      label: 'Rounds with a multi-kill',
      value: pct(player.roundsWithMultiKillPct),
      percentile: calculatePercentile(player.roundsWithMultiKillPct, getStatValues(tierPlayers, (p) => p.roundsWithMultiKillPct)),
    },
    {
      label: 'Pistol round rating',
      value: player.pistolRoundRating.toFixed(2),
      percentile: calculatePercentile(player.pistolRoundRating, getStatValues(tierPlayers, (p) => p.pistolRoundRating)),
    },
  ];

  // Entrying stats with percentiles
  const entryingStats: StatWithPercentile[] = [
    {
      label: 'Saved by teammate per round',
      value: player.savedByTeammatePerRound.toFixed(2),
      percentile: calculatePercentile(player.savedByTeammatePerRound, getStatValues(tierPlayers, (p) => p.savedByTeammatePerRound)),
    },
    {
      label: 'Traded deaths per round',
      value: player.tradedDeathsPerRound.toFixed(2),
      percentile: calculatePercentile(player.tradedDeathsPerRound, getStatValues(tierPlayers, (p) => p.tradedDeathsPerRound)),
    },
    {
      label: 'Traded deaths percentage',
      value: pct(player.tradedDeathsPct),
      percentile: calculatePercentile(player.tradedDeathsPct, getStatValues(tierPlayers, (p) => p.tradedDeathsPct)),
    },
    {
      label: 'Opening deaths traded percentage',
      value: pct(player.openingDeathsTradedPct),
      percentile: calculatePercentile(player.openingDeathsTradedPct, getStatValues(tierPlayers, (p) => p.openingDeathsTradedPct)),
    },
    {
      label: 'Assists per round',
      value: player.assistsPerRound.toFixed(2),
      percentile: calculatePercentile(player.assistsPerRound, getStatValues(tierPlayers, (p) => p.assistsPerRound)),
    },
    {
      label: 'Support rounds',
      value: pct(player.supportRoundsPct),
      percentile: calculatePercentile(player.supportRoundsPct, getStatValues(tierPlayers, (p) => p.supportRoundsPct)),
    },
  ];

  // Trading stats with percentiles
  const tradingStats: StatWithPercentile[] = [
    {
      label: 'Saved teammate per round',
      value: player.savedTeammatePerRound.toFixed(2),
      percentile: calculatePercentile(player.savedTeammatePerRound, getStatValues(tierPlayers, (p) => p.savedTeammatePerRound)),
    },
    {
      label: 'Trade kills per round',
      value: player.tradeKillsPerRound.toFixed(2),
      percentile: calculatePercentile(player.tradeKillsPerRound, getStatValues(tierPlayers, (p) => p.tradeKillsPerRound)),
    },
    {
      label: 'Trade kills percentage',
      value: pct(player.tradeKillsPct),
      percentile: calculatePercentile(player.tradeKillsPct, getStatValues(tierPlayers, (p) => p.tradeKillsPct)),
    },
    {
      label: 'Assisted kills percentage',
      value: pct(player.assistedKillsPct),
      percentile: calculatePercentile(player.assistedKillsPct, getStatValues(tierPlayers, (p) => p.assistedKillsPct)),
    },
    {
      label: 'Damage per kill',
      value: player.damagePerKill.toFixed(0),
      percentile: calculatePercentile(player.damagePerKill, getStatValues(tierPlayers, (p) => p.damagePerKill)),
    },
  ];

  // Opening stats with percentiles
  const openingStats: StatWithPercentile[] = [
    {
      label: 'Opening kills per round',
      value: player.openingKillsPerRound.toFixed(2),
      percentile: calculatePercentile(player.openingKillsPerRound, getStatValues(tierPlayers, (p) => p.openingKillsPerRound)),
    },
    {
      label: 'Opening deaths per round',
      value: player.openingDeathsPerRound.toFixed(2),
      percentile: calculatePercentile(player.openingDeathsPerRound, getStatValues(tierPlayers, (p) => p.openingDeathsPerRound), true), // Lower is better
    },
    {
      label: 'Opening attempts',
      value: pct(player.openingAttemptsPct),
      percentile: calculatePercentile(player.openingAttemptsPct, getStatValues(tierPlayers, (p) => p.openingAttemptsPct)),
    },
    {
      label: 'Opening success',
      value: pct(player.openingSuccessPct),
      percentile: calculatePercentile(player.openingSuccessPct, getStatValues(tierPlayers, (p) => p.openingSuccessPct)),
    },
    {
      label: 'Win% after opening kill',
      value: pct(player.winPctAfterOpeningKill),
      percentile: calculatePercentile(player.winPctAfterOpeningKill, getStatValues(tierPlayers, (p) => p.winPctAfterOpeningKill)),
    },
    {
      label: 'Attacks per round',
      value: player.attacksPerRound.toFixed(2),
      percentile: calculatePercentile(player.attacksPerRound, getStatValues(tierPlayers, (p) => p.attacksPerRound)),
    },
  ];

  // Clutching stats with percentiles
  const clutchingStats: StatWithPercentile[] = [
    {
      label: 'Clutch points per round',
      value: player.clutchPointsPerRound.toFixed(2),
      percentile: calculatePercentile(player.clutchPointsPerRound, getStatValues(tierPlayers, (p) => p.clutchPointsPerRound)),
    },
    {
      label: 'Last alive percentage',
      value: pct(player.lastAlivePct),
      percentile: calculatePercentile(player.lastAlivePct, getStatValues(tierPlayers, (p) => p.lastAlivePct)),
    },
    {
      label: '1on1 win percentage',
      value: pct(player.clutch1v1WinPct),
      percentile: calculatePercentile(player.clutch1v1WinPct, getStatValues(tierPlayers, (p) => p.clutch1v1WinPct)),
    },
    {
      label: 'Time alive per round',
      value: formatTime(player.timeAlivePerRound),
      percentile: calculatePercentile(player.timeAlivePerRound, getStatValues(tierPlayers, (p) => p.timeAlivePerRound)),
    },
    {
      label: 'Saves per round loss',
      value: player.savesPerRoundLoss.toFixed(2),
      percentile: calculatePercentile(player.savesPerRoundLoss, getStatValues(tierPlayers, (p) => p.savesPerRoundLoss)),
    },
  ];

  // Sniping stats with percentiles
  const snipingStats: StatWithPercentile[] = [
    {
      label: 'Sniper kills per round',
      value: player.awpKillsPerRound.toFixed(2),
      percentile: calculatePercentile(player.awpKillsPerRound, getStatValues(tierPlayers, (p) => p.awpKillsPerRound)),
    },
    {
      label: 'Sniper kills percentage',
      value: pct(player.awpKillsPct),
      percentile: calculatePercentile(player.awpKillsPct, getStatValues(tierPlayers, (p) => p.awpKillsPct)),
    },
    {
      label: 'Rounds with sniper kills percentage',
      value: pct(player.roundsWithAwpKillPct),
      percentile: calculatePercentile(player.roundsWithAwpKillPct, getStatValues(tierPlayers, (p) => p.roundsWithAwpKillPct)),
    },
    {
      label: 'Sniper multi-kill rounds',
      value: player.awpMultiKillRoundsPerRound.toFixed(2),
      percentile: calculatePercentile(player.awpMultiKillRoundsPerRound, getStatValues(tierPlayers, (p) => p.awpMultiKillRoundsPerRound)),
    },
    {
      label: 'Sniper opening kills per round',
      value: player.awpOpeningKillsPerRound.toFixed(2),
      percentile: calculatePercentile(player.awpOpeningKillsPerRound, getStatValues(tierPlayers, (p) => p.awpOpeningKillsPerRound)),
    },
  ];

  // Utility stats with percentiles
  const utilityStats: StatWithPercentile[] = [
    {
      label: 'Utility damage per round',
      value: player.utilityDamagePerRound.toFixed(2),
      percentile: calculatePercentile(player.utilityDamagePerRound, getStatValues(tierPlayers, (p) => p.utilityDamagePerRound)),
    },
    {
      label: 'Utility kills per 100 rounds',
      value: player.utilityKillsPer100Rounds.toFixed(2),
      percentile: calculatePercentile(player.utilityKillsPer100Rounds, getStatValues(tierPlayers, (p) => p.utilityKillsPer100Rounds)),
    },
    {
      label: 'Flashes thrown per round',
      value: player.flashesThrownPerRound.toFixed(2),
      percentile: calculatePercentile(player.flashesThrownPerRound, getStatValues(tierPlayers, (p) => p.flashesThrownPerRound)),
    },
    {
      label: 'Flash assists per round',
      value: player.flashAssistsPerRound.toFixed(2),
      percentile: calculatePercentile(player.flashAssistsPerRound, getStatValues(tierPlayers, (p) => p.flashAssistsPerRound)),
    },
    {
      label: 'Time opponent flashed per round',
      value: `${player.enemyFlashDurationPerRound.toFixed(2)}s`,
      percentile: calculatePercentile(player.enemyFlashDurationPerRound, getStatValues(tierPlayers, (p) => p.enemyFlashDurationPerRound)),
    },
  ];

  // Calculate average percentile for each category
  const avgPercentile = (stats: StatWithPercentile[]) =>
    Math.round(stats.reduce((sum, s) => sum + s.percentile, 0) / stats.length);

  const firepowerRating = avgPercentile(firepowerStats);
  const entryingRating = avgPercentile(entryingStats);
  const tradingRating = avgPercentile(tradingStats);
  const openingRating = avgPercentile(openingStats);
  const clutchingRating = avgPercentile(clutchingStats);
  const snipingRating = avgPercentile(snipingStats);
  const utilityRating = avgPercentile(utilityStats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      <RatingCard
        key="firepower"
        title="Firepower"
        icon={<Flame size={16} className="text-orange-400" />}
        rating={firepowerRating}
        accentColor="bg-orange-400"
        stats={firepowerStats}
        defaultExpanded={!defaultCollapsed}
      />

      <RatingCard
        key="entrying"
        title="Entrying"
        icon={<Users size={16} className="text-blue-400" />}
        rating={entryingRating}
        accentColor="bg-blue-400"
        stats={entryingStats}
        defaultExpanded={!defaultCollapsed}
      />

      <RatingCard
        key="trading"
        title="Trading"
        icon={<Swords size={16} className="text-purple-400" />}
        rating={tradingRating}
        accentColor="bg-purple-400"
        stats={tradingStats}
        defaultExpanded={!defaultCollapsed}
      />

      <RatingCard
        key="opening"
        title="Opening"
        icon={<Zap size={16} className="text-emerald-400" />}
        rating={openingRating}
        accentColor="bg-emerald-400"
        stats={openingStats}
        defaultExpanded={!defaultCollapsed}
      />

      <RatingCard
        key="clutching"
        title="Clutching"
        icon={<Award size={16} className="text-neon-purple" />}
        rating={clutchingRating}
        accentColor="bg-neon-purple"
        stats={clutchingStats}
        defaultExpanded={!defaultCollapsed}
      />

      <RatingCard
        key="sniping"
        title="Sniping"
        icon={<Eye size={16} className="text-neon-cyan" />}
        rating={snipingRating}
        accentColor="bg-neon-cyan"
        stats={snipingStats}
        defaultExpanded={!defaultCollapsed}
      />

      <RatingCard
        key="utility"
        title="Utility"
        icon={<Shield size={16} className="text-yellow-400" />}
        rating={utilityRating}
        accentColor="bg-yellow-400"
        stats={utilityStats}
        defaultExpanded={!defaultCollapsed}
      />
    </div>
  );
}
