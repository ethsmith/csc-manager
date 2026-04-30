import { useMemo, useState } from 'react';
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
  Users,
  DollarSign,
  Swords,
  HandHelping,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Bomb,
} from 'lucide-react';
import type { PlayerStats, GroupedPlayer, StatMode, PlayerTierBreakdown } from '../types';
import StatCard from './StatCard';
import PerformanceRadar from './RadarChart';
import KillDistribution from './KillDistribution';
import SideComparison from './SideComparison';
import MapRatings from './MapRatings';
import ModeToggle from './ModeToggle';
import HLTVRatingCards from './HLTVRatingCards';
import TierBreakdown from './TierBreakdown';
import { statRanges, getStatColor } from '../statRanges';

function ratingColor(rating: number): string {
  return getStatColor(rating, statRanges.hltvRating);
}

function kdRatio(kills: number, deaths: number): string {
  if (deaths === 0) return kills.toFixed(2);
  return (kills / deaths).toFixed(2);
}

function pct(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

function ipct(val: number): string {
  return `${(val * 100).toFixed(0)}%`;
}

function getEntry(gp: GroupedPlayer, mode: StatMode): PlayerStats | null {
  return gp[mode];
}

function getAllStatsForMode(allPlayers: GroupedPlayer[], mode: StatMode): PlayerStats[] {
  const result: PlayerStats[] = [];
  for (const gp of allPlayers) {
    const stats = gp[mode];
    if (stats) result.push(stats);
  }
  return result;
}

/* ── Collapsible Section ─────────────────────────────────── */

function CollapsibleSection({
  title,
  icon,
  accent,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-xl card-glow overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <span className={`w-1 h-5 rounded-full ${accent}`} />
        <span className="opacity-80">{icon}</span>
        <span className="text-sm font-semibold text-slate-200 flex-1">{title}</span>
        {open ? (
          <ChevronUp size={18} className="text-slate-500" />
        ) : (
          <ChevronDown size={18} className="text-slate-500" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 animate-in">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Mini stat pill used inside collapsible sections ─────── */

function MiniStat({
  label,
  value,
  sub,
  colorClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="bg-dark-800/60 rounded-lg px-3 py-2.5 border border-white/[0.04]">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-base font-bold mt-0.5 ${colorClass ?? 'text-slate-200'}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Progress bar ────────────────────────────────────────── */

function ProgressBar({ value, max, accent }: { value: number; max: number; accent: string }) {
  const w = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-dark-600 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${accent}`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */

interface Props {
  groupedPlayer: GroupedPlayer;
  allGroupedPlayers: GroupedPlayer[];
  mode: StatMode;
  onModeChange: (mode: StatMode) => void;
  onBack: () => void;
  tierBreakdown: PlayerTierBreakdown | null;
}

export default function PlayerDashboard({ groupedPlayer, allGroupedPlayers, mode, onModeChange, onBack, tierBreakdown }: Props) {
  const player = getEntry(groupedPlayer, mode);

  const allPlayers = useMemo(
    () => getAllStatsForMode(allGroupedPlayers, mode),
    [allGroupedPlayers, mode]
  );

  const tierPlayers = useMemo(() => {
    const playerTier = groupedPlayer.cscTier;
    if (!playerTier) return allPlayers;
    const result: PlayerStats[] = [];
    for (const gp of allGroupedPlayers) {
      if (gp.cscTier === playerTier) {
        const stats = gp[mode];
        if (stats) result.push(stats);
      }
    }
    return result;
  }, [allGroupedPlayers, groupedPlayer.cscTier, mode, allPlayers]);

  if (!player) {
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
            onClick={() => onModeChange(mode === 'regulation' ? 'combine' : 'regulation')}
            className="mt-4 px-6 py-2 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors cursor-pointer"
          >
            Switch to {mode === 'regulation' ? 'Combine' : 'Regulation'}
          </button>
        </div>
      </div>
    );
  }

  const kd = kdRatio(player.kills, player.deaths);

  return (
    <div className="space-y-5 animate-in">
      {/* ── Header ──────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="glass rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-neon-blue transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <ModeToggle mode={mode} onChange={onModeChange} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold truncate gradient-text">{groupedPlayer.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`text-sm px-3 py-0.5 rounded-full border ${
                mode === 'combine'
                  ? 'bg-neon-purple/10 text-neon-purple border-neon-purple/20'
                  : 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'
              }`}>
                {mode === 'regulation' ? (groupedPlayer.cscTier ?? player.teamName) : player.teamName}
              </span>
              {mode === 'regulation' && groupedPlayer.cscTier && (
                <span className="text-sm text-slate-500">{player.teamName}</span>
              )}
              <span className="text-sm text-slate-500">
                {player.games} game{player.games !== 1 ? 's' : ''} · {player.roundsPlayed} rounds
              </span>
              {mode === 'combine' && player.name !== groupedPlayer.name && (
                <span className="text-sm text-slate-500 italic">alias: {player.name}</span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center glass rounded-xl px-5 py-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Final Rating</div>
              <div className={`text-3xl font-black ${ratingColor(player.finalRating)}`}>
                {player.finalRating.toFixed(3)}
              </div>
            </div>
            <div className="text-center glass rounded-xl px-5 py-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">HLTV</div>
              <div className={`text-3xl font-black ${ratingColor(player.hltvRating)}`}>
                {player.hltvRating.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Stats ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard label="K / D / A" value={`${player.kills} / ${player.deaths} / ${player.assists}`} icon={<Crosshair size={16} />} />
        <StatCard label="K/D Ratio" value={kd} icon={<Target size={16} />} color={getStatColor(parseFloat(kd), statRanges.kdRatio)} />
        <StatCard label="ADR" value={player.adr.toFixed(1)} icon={<Flame size={16} />} color={getStatColor(player.adr, statRanges.adr)} />
        <StatCard label="KAST" value={pct(player.kast)} icon={<Shield size={16} />} color={getStatColor(player.kast, statRanges.kast)} />
        <StatCard label="KPR" value={player.kpr.toFixed(2)} icon={<Crosshair size={16} />} color={getStatColor(player.kpr, statRanges.kpr)} />
        <StatCard label="DPR" value={player.dpr.toFixed(2)} icon={<Skull size={16} />} color={getStatColor(player.dpr, statRanges.dpr)} />
        <StatCard label="Headshot %" value={pct(player.headshotPct)} icon={<Skull size={16} />} color={getStatColor(player.headshotPct, statRanges.headshotPct)} />
        <StatCard label="Survival" value={pct(player.survival)} icon={<Heart size={16} />} color={getStatColor(player.survival, statRanges.survival)} />
      </div>

      {/* ── Rating Cards ─────────────────────────────── */}
      <HLTVRatingCards player={player} tierPlayers={tierPlayers} />

      {/* ── Tier Breakdown ───────────────────────────── */}
      {tierBreakdown && <TierBreakdown tierBreakdown={tierBreakdown} />}

      {/* ── Charts ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PerformanceRadar player={player} allPlayers={allPlayers} />
        <KillDistribution player={player} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SideComparison player={player} />
        <MapRatings player={player} />
      </div>

      {/* ── Opening Duels ────────────────────────────── */}
      <CollapsibleSection title="Opening Duels" icon={<Zap size={18} />} accent="bg-emerald-400" defaultOpen>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <MiniStat label="Opening Kills" value={player.openingKills} sub={`${player.openingKillsPerRound.toFixed(3)}/rd`} colorClass="text-emerald-400" />
          <MiniStat label="Opening Deaths" value={player.openingDeaths} sub={`${player.openingDeathsPerRound.toFixed(3)}/rd`} colorClass="text-red-400" />
          <MiniStat label="Success Rate" value={pct(player.openingSuccessPct)} colorClass="text-neon-blue" />
          <MiniStat label="Win After Entry" value={pct(player.winPctAfterOpeningKill)} colorClass="text-neon-cyan" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Kill Rate</span>
            <span>{player.openingKills}/{player.openingAttempts} attempts</span>
          </div>
          <ProgressBar value={player.openingKills} max={player.openingAttempts} accent="bg-emerald-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <MiniStat label="Attempts" value={player.openingAttempts} sub={pct(player.openingAttemptsPct)} />
          <MiniStat label="Successes" value={player.openingSuccesses} colorClass="text-neon-blue" />
          <MiniStat label="Rounds Won After" value={player.roundsWonAfterOpening} colorClass="text-emerald-400" />
          <MiniStat label="T Op. Kills" value={player.tOpeningKills} sub={String(player.ctOpeningKills)} colorClass="text-yellow-400" />
        </div>
      </CollapsibleSection>

      {/* ── Side Comparison ──────────────────────────── */}
      <CollapsibleSection title="Side Breakdown" icon={<Shield size={18} />} accent="bg-yellow-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* T Side */}
          <div className="bg-dark-800/40 rounded-lg p-4 border border-white/[0.04]">
            <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-yellow-500" />
              T Side
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <MiniStat label="Rounds" value={player.tRoundsPlayed} />
              <MiniStat label="Rating" value={player.tRating.toFixed(3)} colorClass={ratingColor(player.tRating)} />
              <MiniStat label="Eco Rating" value={player.tEcoRating.toFixed(3)} colorClass={ratingColor(player.tEcoRating)} />
              <MiniStat label="Kills" value={player.tKills} colorClass="text-emerald-400" />
              <MiniStat label="Deaths" value={player.tDeaths} colorClass="text-red-400" />
              <MiniStat label="Damage" value={player.tDamage} colorClass="text-neon-blue" />
              <MiniStat label="KAST" value={pct(player.tKast)} colorClass="text-neon-blue" />
              <MiniStat label="Survivals" value={player.tSurvivals} colorClass="text-emerald-400" />
              <MiniStat label="Multi-Kill Rds" value={player.tRoundsWithMultiKill} colorClass="text-neon-purple" />
              <MiniStat label="Eco Kill Val" value={player.tEcoKillValue} />
              <MiniStat label="Clutch Wins" value={`${player.tClutchWins}/${player.tClutchRounds}`} colorClass="text-neon-purple" />
              <MiniStat label="Man Adv Kills" value={player.tManAdvantageKills} sub={pct(player.tManAdvantageKillsPct)} colorClass="text-emerald-400" />
              <MiniStat label="Man Disadv Dths" value={player.tManDisadvantageDeaths} sub={pct(player.tManDisadvantageDeathsPct)} colorClass="text-red-400" />
              <MiniStat label="Op. Kills" value={player.tOpeningKills} colorClass="text-emerald-400" />
              <MiniStat label="Op. Deaths" value={player.tOpeningDeaths} colorClass="text-red-400" />
            </div>
          </div>
          {/* CT Side */}
          <div className="bg-dark-800/40 rounded-lg p-4 border border-white/[0.04]">
            <h4 className="text-sm font-semibold text-neon-blue mb-3 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-neon-blue" />
              CT Side
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <MiniStat label="Rounds" value={player.ctRoundsPlayed} />
              <MiniStat label="Rating" value={player.ctRating.toFixed(3)} colorClass={ratingColor(player.ctRating)} />
              <MiniStat label="Eco Rating" value={player.ctEcoRating.toFixed(3)} colorClass={ratingColor(player.ctEcoRating)} />
              <MiniStat label="Kills" value={player.ctKills} colorClass="text-emerald-400" />
              <MiniStat label="Deaths" value={player.ctDeaths} colorClass="text-red-400" />
              <MiniStat label="Damage" value={player.ctDamage} colorClass="text-neon-blue" />
              <MiniStat label="KAST" value={pct(player.ctKast)} colorClass="text-neon-blue" />
              <MiniStat label="Survivals" value={player.ctSurvivals} colorClass="text-emerald-400" />
              <MiniStat label="Multi-Kill Rds" value={player.ctRoundsWithMultiKill} colorClass="text-neon-purple" />
              <MiniStat label="Eco Kill Val" value={player.ctEcoKillValue} />
              <MiniStat label="Clutch Wins" value={`${player.ctClutchWins}/${player.ctClutchRounds}`} colorClass="text-neon-purple" />
              <MiniStat label="Man Adv Kills" value={player.ctManAdvantageKills} sub={pct(player.ctManAdvantageKillsPct)} colorClass="text-emerald-400" />
              <MiniStat label="Man Disadv Dths" value={player.ctManDisadvantageDeaths} sub={pct(player.ctManDisadvantageDeathsPct)} colorClass="text-red-400" />
              <MiniStat label="Op. Kills" value={player.ctOpeningKills} colorClass="text-emerald-400" />
              <MiniStat label="Op. Deaths" value={player.ctOpeningDeaths} colorClass="text-red-400" />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Economy & Impact ─────────────────────────── */}
      <CollapsibleSection title="Economy & Impact" icon={<DollarSign size={18} />} accent="bg-yellow-400">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <MiniStat label="Eco Kill Value" value={player.ecoKillValue} colorClass="text-emerald-400" />
          <MiniStat label="Eco Death Value" value={player.ecoDeathValue} colorClass="text-red-400" />
          <MiniStat label="Duel Swing" value={player.duelSwing.toFixed(3)} sub={`${player.duelSwingPerRound.toFixed(4)}/rd`} colorClass="text-neon-cyan" />
          <MiniStat label="Econ Impact" value={player.econImpact.toFixed(1)} colorClass="text-neon-blue" />
          <MiniStat label="Round Impact" value={player.roundImpact.toFixed(3)} colorClass="text-neon-cyan" />
          <MiniStat label="Prob Swing" value={player.probabilitySwing.toFixed(3)} sub={`${player.probabilitySwingPerRound.toFixed(4)}/rd`} colorClass="text-neon-purple" />
          <MiniStat label="Low Buy Kills" value={player.lowBuyKills} sub={pct(player.lowBuyKillsPct)} />
          <MiniStat label="Disadv Buy Kills" value={player.disadvantagedBuyKills} sub={pct(player.disadvantagedBuyKillsPct)} />
          <MiniStat label="Exit Frags" value={player.exitFrags} colorClass="text-neon-cyan" />
          <MiniStat label="Saves On Loss" value={player.savesOnLoss} sub={`${player.savesPerRoundLoss.toFixed(3)}/rd`} />
        </div>
      </CollapsibleSection>

      {/* ── Trading & Teamplay ───────────────────────── */}
      <CollapsibleSection title="Trading & Teamplay" icon={<Swords size={18} />} accent="bg-neon-blue">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <MiniStat label="Trade Kills" value={player.tradeKills} sub={`${player.tradeKillsPerRound.toFixed(3)}/rd · ${pct(player.tradeKillsPct)}`} colorClass="text-emerald-400" />
          <MiniStat label="Fast Trades" value={player.fastTrades} colorClass="text-neon-cyan" />
          <MiniStat label="Traded Deaths" value={player.tradedDeaths} sub={`${player.tradedDeathsPerRound.toFixed(3)}/rd · ${pct(player.tradedDeathsPct)}`} colorClass="text-yellow-400" />
          <MiniStat label="Trade Denials" value={player.tradeDenials} colorClass="text-red-400" />
          <MiniStat label="Saved Teammate" value={player.savedTeammate} sub={`${player.savedTeammatePerRound.toFixed(3)}/rd`} colorClass="text-emerald-400" />
          <MiniStat label="Saved By Mate" value={player.savedByTeammate} sub={`${player.savedByTeammatePerRound.toFixed(3)}/rd`} />
          <MiniStat label="OD Traded" value={player.openingDeathsTraded} sub={pct(player.openingDeathsTradedPct)} />
          <MiniStat label="Last Alive Rds" value={player.lastAliveRounds} sub={pct(player.lastAlivePct)} />
          <MiniStat label="Support Rounds" value={player.supportRounds} sub={pct(player.supportRoundsPct)} colorClass="text-neon-blue" />
          <MiniStat label="Assisted Kills" value={player.assistedKills} sub={pct(player.assistedKillsPct)} colorClass="text-emerald-400" />
          <MiniStat label="Assists / Rd" value={player.assistsPerRound.toFixed(3)} />
          <MiniStat label="Attack Rounds" value={player.attackRounds} sub={`${player.attacksPerRound.toFixed(3)}/rd`} />
        </div>
      </CollapsibleSection>

      {/* ── Combat ───────────────────────────────────── */}
      <CollapsibleSection title="Combat & Multi-Kills" icon={<Flame size={18} />} accent="bg-orange-400">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: '1K', val: player.oneK },
              { label: '2K', val: player.twoK, c: 'text-neon-blue' },
              { label: '3K', val: player.threeK, c: 'text-neon-cyan' },
              { label: '4K', val: player.fourK, c: 'text-neon-purple' },
              { label: '5K', val: player.fiveK, c: 'text-emerald-400' },
            ].map((mk) => (
              <span key={mk.label} className={`text-xs px-2 py-1 rounded border border-white/10 bg-dark-700/50 ${mk.c ?? 'text-slate-300'}`}>
                {mk.label} <span className="font-bold">{mk.val}</span>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <MiniStat label="Rounds w/ Kill" value={player.roundsWithKill} sub={pct(player.roundsWithKillPct)} />
            <MiniStat label="Rounds w/ Multi" value={player.roundsWithMultiKill} sub={pct(player.roundsWithMultiKillPct)} />
            <MiniStat label="Kills Won Rds" value={player.killsInWonRounds} sub={`${player.killsPerRoundWin.toFixed(2)}/rd`} colorClass="text-emerald-400" />
            <MiniStat label="Dmg Won Rds" value={player.damageInWonRounds} sub={`${player.damagePerRoundWin.toFixed(1)}/rd`} />
            <MiniStat label="Perfect Kills" value={player.perfectKills} colorClass="text-emerald-400" />
            <MiniStat label="Knife Kills" value={player.knifeKills} colorClass="text-neon-purple" />
            <MiniStat label="Pistol vs Rifle" value={player.pistolVsRifleKills} colorClass="text-yellow-400" />
            <MiniStat label="Avg TTK" value={`${player.avgTimeToKill.toFixed(2)}s`} />
            <MiniStat label="Avg TTD" value={`${player.avgTimeToDeath.toFixed(2)}s`} />
            <MiniStat label="Dmg / Kill" value={player.damagePerKill.toFixed(1)} />
            <MiniStat label="Time Alive/Rd" value={`${player.timeAlivePerRound.toFixed(1)}s`} />
            <MiniStat label="Damage Taken" value={player.damageTaken} colorClass="text-red-400" />
            <MiniStat label="Early Deaths" value={player.earlyDeaths} colorClass="text-red-400" />
            <MiniStat label="Man Adv Kills" value={player.manAdvantageKills} sub={pct(player.manAdvantageKillsPct)} colorClass="text-emerald-400" />
            <MiniStat label="Man Disadv Dths" value={player.manDisadvantageDeaths} sub={pct(player.manDisadvantageDeathsPct)} colorClass="text-red-400" />
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Clutch ───────────────────────────────────── */}
      <CollapsibleSection title="Clutch Performance" icon={<Award size={18} />} accent="bg-neon-purple">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <MiniStat label="Clutch Rounds" value={player.clutchRounds} />
          <MiniStat label="Clutch Wins" value={player.clutchWins} colorClass="text-neon-purple" />
          <MiniStat label="Pts / Rd" value={player.clutchPointsPerRound.toFixed(4)} colorClass="text-neon-cyan" />
          <MiniStat label="1v1" value={`${player.clutch1v1Wins}/${player.clutch1v1Attempts}`} sub={player.clutch1v1Attempts > 0 ? pct(player.clutch1v1WinPct) : undefined} colorClass="text-emerald-400" />
          <MiniStat label="1v2" value={`${player.clutch1v2Wins}/${player.clutch1v2Attempts}`} colorClass="text-neon-purple" />
          <MiniStat label="1v3" value={`${player.clutch1v3Wins}/${player.clutch1v3Attempts}`} colorClass="text-neon-purple" />
          <MiniStat label="1v4" value={`${player.clutch1v4Wins}/${player.clutch1v4Attempts}`} colorClass="text-neon-purple" />
          <MiniStat label="1v5" value={`${player.clutch1v5Wins}/${player.clutch1v5Attempts}`} colorClass="text-neon-purple" />
        </div>
      </CollapsibleSection>

      {/* ── Pistol & AWP ─────────────────────────────── */}
      <CollapsibleSection title="Pistol & AWP" icon={<Target size={18} />} accent="bg-neon-cyan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pistol */}
          <div className="bg-dark-800/40 rounded-lg p-4 border border-white/[0.04]">
            <h4 className="text-sm font-semibold text-neon-cyan mb-3 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-neon-cyan" />
              Pistol Rounds
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <MiniStat label="Played" value={player.pistolRoundsPlayed} />
              <MiniStat label="Won" value={player.pistolRoundsWon} colorClass="text-emerald-400" />
              <MiniStat label="Rating" value={player.pistolRoundRating.toFixed(3)} colorClass={ratingColor(player.pistolRoundRating)} />
              <MiniStat label="Kills" value={player.pistolRoundKills} colorClass="text-neon-blue" />
              <MiniStat label="Deaths" value={player.pistolRoundDeaths} colorClass="text-red-400" />
              <MiniStat label="Damage" value={player.pistolRoundDamage} colorClass="text-neon-cyan" />
              <MiniStat label="Survivals" value={player.pistolRoundSurvivals} colorClass="text-emerald-400" />
              <MiniStat label="Multi-Kills" value={player.pistolRoundMultiKills} colorClass="text-neon-purple" />
            </div>
          </div>
          {/* AWP */}
          <div className="bg-dark-800/40 rounded-lg p-4 border border-white/[0.04]">
            <h4 className="text-sm font-semibold text-neon-blue mb-3 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-neon-blue" />
              AWP {player.awpKills === 0 && <span className="text-slate-500 font-normal text-xs">— no kills recorded</span>}
            </h4>
            {player.awpKills > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <MiniStat label="Kills" value={player.awpKills} sub={`${player.awpKillsPerRound.toFixed(3)}/rd`} colorClass="text-neon-blue" />
                <MiniStat label="Kill %" value={pct(player.awpKillsPct)} colorClass="text-neon-blue" />
                <MiniStat label="Kill Rounds" value={player.roundsWithAwpKill} sub={pct(player.roundsWithAwpKillPct)} />
                <MiniStat label="Multi-Kill Rds" value={player.awpMultiKillRounds} sub={`${player.awpMultiKillRoundsPerRound.toFixed(4)}/rd`} colorClass="text-neon-purple" />
                <MiniStat label="Op. Kills" value={player.awpOpeningKills} sub={`${player.awpOpeningKillsPerRound.toFixed(4)}/rd`} colorClass="text-emerald-400" />
                <MiniStat label="Deaths" value={player.awpDeaths} colorClass="text-red-400" />
                <MiniStat label="Deaths No Kill" value={player.awpDeathsNoKill} colorClass="text-red-400" />
              </div>
            ) : null}
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Utility ──────────────────────────────────── */}
      <CollapsibleSection title="Utility Usage" icon={<Bomb size={18} />} accent="bg-yellow-400">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <MiniStat label="Util Damage" value={player.utilityDamage} sub={`${player.utilityDamagePerRound.toFixed(1)}/rd`} colorClass="text-neon-blue" />
          <MiniStat label="Util Kills" value={player.utilityKills} sub={`${player.utilityKillsPer100Rounds.toFixed(2)}/100rd`} colorClass="text-neon-cyan" />
          <MiniStat label="HE Damage" value={player.heDamage} colorClass="text-orange-400" />
          <MiniStat label="Fire Damage" value={player.fireDamage} colorClass="text-red-400" />
          <MiniStat label="Flashes Thrown" value={player.flashesThrown} sub={`${player.flashesThrownPerRound.toFixed(2)}/rd`} colorClass="text-yellow-400" />
          <MiniStat label="Flash Assists" value={player.flashAssists} sub={`${player.flashAssistsPerRound.toFixed(3)}/rd`} colorClass="text-yellow-300" />
          <MiniStat label="Enemy Flash" value={`${player.enemyFlashDurationPerRound.toFixed(2)}s`} sub={`${player.enemiesFlashed} enemies`} colorClass="text-emerald-400" />
          <MiniStat label="Team Flash" value={player.teamFlashCount} sub={`${player.teamFlashDurationPerRound.toFixed(2)}s/rd`} colorClass="text-red-400" />
          <MiniStat label="Smokes" value={player.smokesThrown} />
          <MiniStat label="HEs" value={player.hesThrown} colorClass="text-orange-400" />
          <MiniStat label="Mollies" value={player.molotovsThrown} colorClass="text-red-400" />
          <MiniStat label="Total Nades" value={player.totalNadesThrown} colorClass="text-neon-cyan" />
        </div>
      </CollapsibleSection>
    </div>
  );
}
