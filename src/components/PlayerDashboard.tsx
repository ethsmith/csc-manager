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
  Users,
  DollarSign,
  Swords,
  HandHelping,
} from 'lucide-react';
import type { PlayerStats, GroupedPlayer, StatMode, StatEntry } from '../types';
import StatCard from './StatCard';
import PerformanceRadar from './RadarChart';
import KillDistribution from './KillDistribution';
import SideComparison from './SideComparison';
import MapRatings from './MapRatings';
import ModeToggle from './ModeToggle';

interface StatItemProps {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

function StatItem({ label, value, subValue, color = 'text-slate-200' }: StatItemProps) {
  return (
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
    </div>
  );
}

interface StatSectionProps {
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  children: React.ReactNode;
}

function StatSection({ title, icon, gradientFrom, gradientTo, children }: StatSectionProps) {
  return (
    <div className="glass rounded-xl p-6 card-glow group">
      <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
        <span className={`w-1.5 h-5 bg-gradient-to-b ${gradientFrom} ${gradientTo} rounded-full`}></span>
        {icon} {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

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
          <h1 className="text-3xl font-bold truncate gradient-text">{groupedPlayer.name}</h1>
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
        <div className="text-right glass rounded-xl px-5 py-3 card-glow">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Final Rating</div>
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
        <div className="glass rounded-xl p-6 card-glow group">
          <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-emerald-400 to-neon-blue rounded-full"></span>
            <Zap size={18} className="opacity-80" /> Opening Duels
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
        <div className="glass rounded-xl p-6 card-glow group">
          <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-neon-purple to-neon-pink rounded-full"></span>
            <Award size={18} className="opacity-80" /> Clutch & Trading
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
        <div className="glass rounded-xl p-6 card-glow group">
          <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-neon-blue to-neon-cyan rounded-full"></span>
            <Eye size={18} className="opacity-80" /> AWP Stats
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
        <div className="glass rounded-xl p-6 card-glow group">
          <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></span>
            <Shield size={18} className="opacity-80" /> Utility Usage
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
      <StatSection title="Pistol Rounds" icon={<Target size={18} className="opacity-80" />} gradientFrom="from-neon-cyan" gradientTo="to-emerald-400">
        <StatItem label="Rounds Played" value={player.pistolRoundsPlayed} />
        <StatItem label="Rounds Won" value={player.pistolRoundsWon} color="text-emerald-400" />
        <StatItem label="Kills" value={player.pistolRoundKills} color="text-neon-blue" />
        <StatItem label="Deaths" value={player.pistolRoundDeaths} color="text-red-400" />
        <StatItem label="Damage" value={player.pistolRoundDamage} color="text-neon-cyan" />
        <StatItem label="Survivals" value={player.pistolRoundSurvivals} color="text-emerald-400" />
        <StatItem label="Multi-Kills" value={player.pistolRoundMultiKills} color="text-neon-purple" />
        <StatItem label="Rating" value={player.pistolRoundRating.toFixed(3)} color={ratingColor(player.pistolRoundRating)} />
      </StatSection>

      {/* Economy & Impact */}
      <StatSection title="Economy & Impact" icon={<DollarSign size={18} className="opacity-80" />} gradientFrom="from-yellow-400" gradientTo="to-emerald-400">
        <StatItem label="Eco Kill Value" value={player.ecoKillValue} color="text-emerald-400" />
        <StatItem label="Eco Death Value" value={player.ecoDeathValue} color="text-red-400" />
        <StatItem label="Econ Impact" value={player.econImpact.toFixed(1)} color="text-neon-blue" />
        <StatItem label="Round Impact" value={player.roundImpact.toFixed(3)} color="text-neon-cyan" />
        <StatItem label="Probability Swing" value={player.probabilitySwing.toFixed(3)} color="text-neon-purple" />
        <StatItem label="Prob Swing/Rd" value={player.probabilitySwingPerRound.toFixed(4)} />
        <StatItem label="Low Buy Kills" value={player.lowBuyKills} subValue={pct(player.lowBuyKillsPct)} />
        <StatItem label="Disadvantaged Buy Kills" value={player.disadvantagedBuyKills} subValue={pct(player.disadvantagedBuyKillsPct)} />
      </StatSection>

      {/* Trading Stats */}
      <StatSection title="Trading" icon={<Swords size={18} className="opacity-80" />} gradientFrom="from-neon-blue" gradientTo="to-neon-purple">
        <StatItem label="Trade Kills" value={player.tradeKills} subValue={`${player.tradeKillsPerRound.toFixed(3)}/rd`} color="text-emerald-400" />
        <StatItem label="Trade Kills %" value={pct(player.tradeKillsPct)} color="text-emerald-400" />
        <StatItem label="Fast Trades" value={player.fastTrades} color="text-neon-cyan" />
        <StatItem label="Traded Deaths" value={player.tradedDeaths} subValue={`${player.tradedDeathsPerRound.toFixed(3)}/rd`} color="text-yellow-400" />
        <StatItem label="Traded Deaths %" value={pct(player.tradedDeathsPct)} color="text-yellow-400" />
        <StatItem label="Trade Denials" value={player.tradeDenials} color="text-red-400" />
        <StatItem label="Saved By Teammate" value={player.savedByTeammate} subValue={`${player.savedByTeammatePerRound.toFixed(3)}/rd`} />
        <StatItem label="Saved Teammate" value={player.savedTeammate} subValue={`${player.savedTeammatePerRound.toFixed(3)}/rd`} color="text-emerald-400" />
        <StatItem label="Opening Deaths Traded" value={player.openingDeathsTraded} subValue={pct(player.openingDeathsTradedPct)} />
      </StatSection>

      {/* Support & Teamplay */}
      <StatSection title="Support & Teamplay" icon={<HandHelping size={18} className="opacity-80" />} gradientFrom="from-emerald-400" gradientTo="to-neon-blue">
        <StatItem label="Support Rounds" value={player.supportRounds} subValue={pct(player.supportRoundsPct)} color="text-neon-blue" />
        <StatItem label="Assisted Kills" value={player.assistedKills} subValue={pct(player.assistedKillsPct)} color="text-emerald-400" />
        <StatItem label="Assists/Rd" value={player.assistsPerRound.toFixed(3)} />
        <StatItem label="Attack Rounds" value={player.attackRounds} subValue={`${player.attacksPerRound.toFixed(3)}/rd`} />
      </StatSection>

      {/* Multi-Kill & Won Round Stats */}
      <StatSection title="Multi-Kills & Won Rounds" icon={<Flame size={18} className="opacity-80" />} gradientFrom="from-orange-400" gradientTo="to-red-500">
        <StatItem label="1K Rounds" value={player.oneK} />
        <StatItem label="2K Rounds" value={player.twoK} color="text-neon-blue" />
        <StatItem label="3K Rounds" value={player.threeK} color="text-neon-cyan" />
        <StatItem label="4K Rounds" value={player.fourK} color="text-neon-purple" />
        <StatItem label="5K Rounds" value={player.fiveK} color="text-emerald-400" />
        <StatItem label="Rounds w/ Kill" value={player.roundsWithKill} subValue={pct(player.roundsWithKillPct)} />
        <StatItem label="Rounds w/ Multi-Kill" value={player.roundsWithMultiKill} subValue={pct(player.roundsWithMultiKillPct)} />
        <StatItem label="Kills In Won Rounds" value={player.killsInWonRounds} subValue={`${player.killsPerRoundWin.toFixed(2)}/rd win`} color="text-emerald-400" />
        <StatItem label="Damage In Won Rounds" value={player.damageInWonRounds} subValue={`${player.damagePerRoundWin.toFixed(1)}/rd win`} />
        <StatItem label="Perfect Kills" value={player.perfectKills} color="text-emerald-400" />
      </StatSection>

      {/* Combat Situations */}
      <StatSection title="Combat Situations" icon={<Users size={18} className="opacity-80" />} gradientFrom="from-red-400" gradientTo="to-orange-500">
        <StatItem label="Man Advantage Kills" value={player.manAdvantageKills} subValue={pct(player.manAdvantageKillsPct)} color="text-emerald-400" />
        <StatItem label="Man Disadvantage Deaths" value={player.manDisadvantageDeaths} subValue={pct(player.manDisadvantageDeathsPct)} color="text-red-400" />
        <StatItem label="Exit Frags" value={player.exitFrags} color="text-neon-cyan" />
        <StatItem label="Early Deaths" value={player.earlyDeaths} color="text-red-400" />
        <StatItem label="Last Alive Rounds" value={player.lastAliveRounds} subValue={pct(player.lastAlivePct)} />
        <StatItem label="Saves On Loss" value={player.savesOnLoss} subValue={`${player.savesPerRoundLoss.toFixed(3)}/rd loss`} />
        <StatItem label="Knife Kills" value={player.knifeKills} color="text-neon-purple" />
        <StatItem label="Pistol vs Rifle Kills" value={player.pistolVsRifleKills} color="text-yellow-400" />
      </StatSection>

      {/* Extended AWP Stats */}
      <StatSection title="AWP (Extended)" icon={<Eye size={18} className="opacity-80" />} gradientFrom="from-neon-blue" gradientTo="to-neon-cyan">
        <StatItem label="AWP Kills" value={player.awpKills} subValue={`${player.awpKillsPerRound.toFixed(3)}/rd`} color="text-neon-blue" />
        <StatItem label="AWP Kills %" value={pct(player.awpKillsPct)} color="text-neon-blue" />
        <StatItem label="Rounds w/ AWP Kill" value={player.roundsWithAwpKill} subValue={pct(player.roundsWithAwpKillPct)} />
        <StatItem label="AWP Multi-Kill Rds" value={player.awpMultiKillRounds} subValue={`${player.awpMultiKillRoundsPerRound.toFixed(4)}/rd`} color="text-neon-purple" />
        <StatItem label="AWP Opening Kills" value={player.awpOpeningKills} subValue={`${player.awpOpeningKillsPerRound.toFixed(4)}/rd`} color="text-emerald-400" />
        <StatItem label="AWP Deaths" value={player.awpDeaths} color="text-red-400" />
        <StatItem label="AWP Deaths No Kill" value={player.awpDeathsNoKill} color="text-red-400" />
      </StatSection>

      {/* Extended Utility Stats */}
      <StatSection title="Utility (Extended)" icon={<Shield size={18} className="opacity-80" />} gradientFrom="from-yellow-400" gradientTo="to-orange-500">
        <StatItem label="Utility Damage" value={player.utilityDamage} subValue={`${player.utilityDamagePerRound.toFixed(1)}/rd`} color="text-neon-blue" />
        <StatItem label="Utility Kills" value={player.utilityKills} subValue={`${player.utilityKillsPer100Rounds.toFixed(2)}/100 rds`} color="text-neon-cyan" />
        <StatItem label="Flashes Thrown" value={player.flashesThrown} subValue={`${player.flashesThrownPerRound.toFixed(2)}/rd`} color="text-yellow-400" />
        <StatItem label="Flash Assists" value={player.flashAssists} subValue={`${player.flashAssistsPerRound.toFixed(3)}/rd`} color="text-yellow-300" />
        <StatItem label="Enemy Flash/Rd" value={`${player.enemyFlashDurationPerRound.toFixed(2)}s`} color="text-emerald-400" />
        <StatItem label="Team Flash Count" value={player.teamFlashCount} color="text-red-400" />
        <StatItem label="Team Flash/Rd" value={`${player.teamFlashDurationPerRound.toFixed(2)}s`} color="text-red-400" />
      </StatSection>

      {/* Extended Opening Duels */}
      <StatSection title="Opening Duels (Extended)" icon={<Zap size={18} className="opacity-80" />} gradientFrom="from-emerald-400" gradientTo="to-neon-blue">
        <StatItem label="Opening Kills" value={player.openingKills} subValue={`${player.openingKillsPerRound.toFixed(3)}/rd`} color="text-emerald-400" />
        <StatItem label="Opening Deaths" value={player.openingDeaths} subValue={`${player.openingDeathsPerRound.toFixed(3)}/rd`} color="text-red-400" />
        <StatItem label="Opening Attempts" value={player.openingAttempts} subValue={pct(player.openingAttemptsPct)} />
        <StatItem label="Opening Successes" value={player.openingSuccesses} subValue={pct(player.openingSuccessPct)} color="text-neon-blue" />
        <StatItem label="Rounds Won After Opening" value={player.roundsWonAfterOpening} color="text-emerald-400" />
        <StatItem label="Win % After Entry" value={pct(player.winPctAfterOpeningKill)} color="text-neon-cyan" />
      </StatSection>

      {/* Extended Clutch Stats */}
      <StatSection title="Clutch (Extended)" icon={<Award size={18} className="opacity-80" />} gradientFrom="from-neon-purple" gradientTo="to-neon-pink">
        <StatItem label="Clutch Rounds" value={player.clutchRounds} />
        <StatItem label="Clutch Wins" value={player.clutchWins} color="text-neon-purple" />
        <StatItem label="Clutch Points/Rd" value={player.clutchPointsPerRound.toFixed(4)} color="text-neon-cyan" />
        <StatItem label="1v1 Attempts" value={player.clutch1v1Attempts} />
        <StatItem label="1v1 Wins" value={player.clutch1v1Wins} color="text-neon-purple" />
        <StatItem label="1v1 Win %" value={pct(player.clutch1v1WinPct)} color="text-emerald-400" />
      </StatSection>

      {/* T Side Extended */}
      <StatSection title="T Side (Extended)" icon={<Crosshair size={18} className="opacity-80" />} gradientFrom="from-yellow-500" gradientTo="to-orange-500">
        <StatItem label="T Rounds Played" value={player.tRoundsPlayed} />
        <StatItem label="T Kills" value={player.tKills} color="text-emerald-400" />
        <StatItem label="T Deaths" value={player.tDeaths} color="text-red-400" />
        <StatItem label="T Damage" value={player.tDamage} color="text-neon-blue" />
        <StatItem label="T Survivals" value={player.tSurvivals} color="text-emerald-400" />
        <StatItem label="T Multi-Kill Rds" value={player.tRoundsWithMultiKill} color="text-neon-purple" />
        <StatItem label="T Eco Kill Value" value={player.tEcoKillValue} />
        <StatItem label="T KAST" value={pct(player.tKast)} color="text-neon-blue" />
        <StatItem label="T Clutch Rounds" value={player.tClutchRounds} />
        <StatItem label="T Clutch Wins" value={player.tClutchWins} color="text-neon-purple" />
        <StatItem label="T Man Adv Kills" value={player.tManAdvantageKills} subValue={pct(player.tManAdvantageKillsPct)} color="text-emerald-400" />
        <StatItem label="T Man Disadv Deaths" value={player.tManDisadvantageDeaths} subValue={pct(player.tManDisadvantageDeathsPct)} color="text-red-400" />
        <StatItem label="T Rating" value={player.tRating.toFixed(3)} color={ratingColor(player.tRating)} />
        <StatItem label="T Eco Rating" value={player.tEcoRating.toFixed(3)} color={ratingColor(player.tEcoRating)} />
      </StatSection>

      {/* CT Side Extended */}
      <StatSection title="CT Side (Extended)" icon={<Shield size={18} className="opacity-80" />} gradientFrom="from-blue-500" gradientTo="to-cyan-500">
        <StatItem label="CT Rounds Played" value={player.ctRoundsPlayed} />
        <StatItem label="CT Kills" value={player.ctKills} color="text-emerald-400" />
        <StatItem label="CT Deaths" value={player.ctDeaths} color="text-red-400" />
        <StatItem label="CT Damage" value={player.ctDamage} color="text-neon-blue" />
        <StatItem label="CT Survivals" value={player.ctSurvivals} color="text-emerald-400" />
        <StatItem label="CT Multi-Kill Rds" value={player.ctRoundsWithMultiKill} color="text-neon-purple" />
        <StatItem label="CT Eco Kill Value" value={player.ctEcoKillValue} />
        <StatItem label="CT KAST" value={pct(player.ctKast)} color="text-neon-blue" />
        <StatItem label="CT Clutch Rounds" value={player.ctClutchRounds} />
        <StatItem label="CT Clutch Wins" value={player.ctClutchWins} color="text-neon-purple" />
        <StatItem label="CT Man Adv Kills" value={player.ctManAdvantageKills} subValue={pct(player.ctManAdvantageKillsPct)} color="text-emerald-400" />
        <StatItem label="CT Man Disadv Deaths" value={player.ctManDisadvantageDeaths} subValue={pct(player.ctManDisadvantageDeathsPct)} color="text-red-400" />
        <StatItem label="CT Rating" value={player.ctRating.toFixed(3)} color={ratingColor(player.ctRating)} />
        <StatItem label="CT Eco Rating" value={player.ctEcoRating.toFixed(3)} color={ratingColor(player.ctEcoRating)} />
      </StatSection>
    </div>
  );
}
