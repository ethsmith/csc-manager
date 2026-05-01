import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  X,
  Trophy,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Sparkles,
  ExternalLink,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  Undo2,
} from 'lucide-react';
import type { GroupedPlayer, PlayerStats, StatMode } from '../types';
import { fetchFranchises, fetchAllPlayers, type Franchise, type FranchisePlayer, type CscPlayer, getPlayerTypeLabel, getPlayerTypeColor, type PlayerType } from '../fetchFranchises';
import { assignArchetypes, computeSkillRatings, ARCHETYPE_BY_ID, type ArchetypeAssignment, type SkillRating } from '../archetypes';
import { statRanges, getStatColor } from '../statRanges';
import ModeToggle from './ModeToggle';

interface Props {
  players: GroupedPlayer[];
}

/* ── Stat config for gap analysis ─────────────────────────────── */

interface GapStatDef {
  key: keyof PlayerStats;
  label: string;
  format: (v: number) => string;
  inverted?: boolean;
}

interface GapStatGroup {
  group: string;
  stats: GapStatDef[];
}

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtFloat = (v: number) => v.toFixed(2);
const fmtFloat3 = (v: number) => v.toFixed(3);
const fmtFloat4 = (v: number) => v.toFixed(4);
const fmtInt = (v: number) => Math.round(v).toString();
const fmtAdr = (v: number) => v.toFixed(1);
const fmtTime = (v: number) => `${v.toFixed(2)}s`;
const fmtDmg = (v: number) => v.toFixed(1);

const GAP_STAT_GROUPS: GapStatGroup[] = [
  {
    group: 'Core',
    stats: [
      { key: 'hltvRating', label: 'HLTV Rating', format: fmtFloat3 },
      { key: 'finalRating', label: 'Final Rating', format: fmtFloat3 },
      { key: 'kpr', label: 'KPR', format: fmtFloat3 },
      { key: 'dpr', label: 'DPR', format: fmtFloat3, inverted: true },
      { key: 'adr', label: 'ADR', format: fmtAdr },
      { key: 'kast', label: 'KAST', format: fmtPct },
      { key: 'survival', label: 'Survival', format: fmtPct },
      { key: 'headshotPct', label: 'HS%', format: fmtPct },
      { key: 'damagePerKill', label: 'DMG/Kill', format: fmtAdr },
    ],
  },
  {
    group: 'Opening Duels',
    stats: [
      { key: 'openingKillsPerRound', label: 'Entry K/R', format: fmtFloat3 },
      { key: 'openingDeathsPerRound', label: 'Entry D/R', format: fmtFloat3, inverted: true },
      { key: 'openingAttemptsPct', label: 'Entry Attempts%', format: fmtPct },
      { key: 'openingSuccessPct', label: 'Entry Win%', format: fmtPct },
      { key: 'winPctAfterOpeningKill', label: 'Win After Entry', format: fmtPct },
    ],
  },
  {
    group: 'Trading & Teamplay',
    stats: [
      { key: 'tradeKillsPerRound', label: 'Trade K/R', format: fmtFloat3 },
      { key: 'tradeKillsPct', label: 'Trade Kill%', format: fmtPct },
      { key: 'tradedDeathsPct', label: 'Traded Death%', format: fmtPct },
      { key: 'openingDeathsTradedPct', label: 'Entry Death Trade%', format: fmtPct },
      { key: 'savedTeammatePerRound', label: 'Saved Mate/R', format: fmtFloat3 },
      { key: 'savedByTeammatePerRound', label: 'Saved By Mate/R', format: fmtFloat3 },
    ],
  },
  {
    group: 'Clutch',
    stats: [
      { key: 'clutchPointsPerRound', label: 'Clutch Pts/R', format: fmtFloat4 },
      { key: 'clutch1v1WinPct', label: '1v1 Win%', format: fmtPct },
      { key: 'lastAlivePct', label: 'Last Alive%', format: fmtPct },
      { key: 'savesPerRoundLoss', label: 'Saves/Loss', format: fmtFloat3 },
    ],
  },
  {
    group: 'Utility',
    stats: [
      { key: 'utilityDamagePerRound', label: 'Util DMG/R', format: fmtFloat },
      { key: 'utilityKillsPer100Rounds', label: 'Util K/100', format: fmtFloat },
      { key: 'flashesThrownPerRound', label: 'Flashes/R', format: fmtFloat3 },
      { key: 'flashAssistsPerRound', label: 'Flash Asst/R', format: fmtFloat3 },
      { key: 'enemyFlashDurationPerRound', label: 'Enemy Flash/R', format: fmtFloat },
      { key: 'teamFlashDurationPerRound', label: 'Team Flash/R', format: fmtFloat, inverted: true },
    ],
  },
  {
    group: 'Support',
    stats: [
      { key: 'supportRoundsPct', label: 'Support%', format: fmtPct },
      { key: 'assistedKillsPct', label: 'Assisted Kill%', format: fmtPct },
      { key: 'assistsPerRound', label: 'Asst/R', format: fmtFloat3 },
      { key: 'attacksPerRound', label: 'Attacks/R', format: fmtFloat3 },
      { key: 'roundsWithKillPct', label: 'Rounds w/ Kill%', format: fmtPct },
      { key: 'roundsWithMultiKillPct', label: 'Multi-Kill%', format: fmtPct },
    ],
  },
  {
    group: 'Side Ratings',
    stats: [
      { key: 'tRating', label: 'T Rating', format: fmtFloat3 },
      { key: 'ctRating', label: 'CT Rating', format: fmtFloat3 },
      { key: 'tEcoRating', label: 'T Eco Rating', format: fmtFloat3 },
      { key: 'ctEcoRating', label: 'CT Eco Rating', format: fmtFloat3 },
      { key: 'pistolRoundRating', label: 'Pistol Rating', format: fmtFloat3 },
    ],
  },
  {
    group: 'Economy & Impact',
    stats: [
      { key: 'econImpact', label: 'Econ Impact', format: fmtFloat },
      { key: 'roundImpact', label: 'Round Impact', format: fmtFloat },
      { key: 'duelSwingPerRound', label: 'Duel Swing/R', format: fmtFloat4 },
      { key: 'probabilitySwingPerRound', label: 'Prob Swing/R', format: fmtFloat4 },
      { key: 'ecoKillValue', label: 'Eco Kill Value', format: fmtInt },
      { key: 'ecoDeathValue', label: 'Eco Death Value', format: fmtInt, inverted: true },
    ],
  },
  {
    group: 'Combat Situations',
    stats: [
      { key: 'manAdvantageKillsPct', label: 'Man Adv K%', format: fmtPct },
      { key: 'manDisadvantageDeathsPct', label: 'Man Disadv D%', format: fmtPct, inverted: true },
      { key: 'lowBuyKillsPct', label: 'Low Buy K%', format: fmtPct },
      { key: 'disadvantagedBuyKillsPct', label: 'Disadv Buy K%', format: fmtPct },
      { key: 'pistolVsRifleKills', label: 'Pistol vs Rifle K', format: fmtInt },
    ],
  },
  {
    group: 'AWP',
    stats: [
      { key: 'awpKillsPerRound', label: 'AWP K/R', format: fmtFloat3 },
      { key: 'awpKillsPct', label: 'AWP Kill%', format: fmtPct },
      { key: 'roundsWithAwpKillPct', label: 'AWP Round%', format: fmtPct },
      { key: 'awpMultiKillRoundsPerRound', label: 'AWP Multi/R', format: fmtFloat4 },
      { key: 'awpOpeningKillsPerRound', label: 'AWP Entry K/R', format: fmtFloat4 },
    ],
  },
];

const ALL_GAP_STATS: GapStatDef[] = GAP_STAT_GROUPS.flatMap((g) => g.stats);
const GAP_STAT_FIELDS: (keyof PlayerStats)[] = ALL_GAP_STATS.map((s) => s.key);

const GAP_STAT_MAP = new Map<keyof PlayerStats, GapStatDef>(
  ALL_GAP_STATS.map((s) => [s.key, s]),
);

/* ── Helpers ───────────────────────────────────────────────────── */

function kd(k: number, d: number): number {
  return d === 0 ? k : +(k / d).toFixed(2);
}

function pctStr(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function medianSorted(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((pct / 100) * (sorted.length - 1))));
  return sorted[idx];
}

function getEntry(gp: GroupedPlayer, mode: StatMode): PlayerStats | null {
  return gp[mode];
}

/* ── Roster stat card ─────────────────────────────────────────── */

function MiniRosterStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-semibold ${color ?? 'text-slate-200'}`}>{value}</div>
    </div>
  );
}

/* ── Gap bar component ─────────────────────────────────────────── */

function GapBar({
  label,
  rosterVal,
  tierMedian,
  tierP25,
  tierP75,
  spread,
  inverted,
  format,
  selected,
  onClick,
}: {
  label: string;
  rosterVal: number;
  tierMedian: number;
  tierP25: number;
  tierP75: number;
  spread: number;
  inverted?: boolean;
  format: (v: number) => string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const displayRoster = inverted ? -rosterVal : rosterVal;
  const displayMedian = inverted ? -tierMedian : tierMedian;
  const displayP25 = inverted ? -tierP75 : tierP25;
  const displayP75 = inverted ? -tierP25 : tierP75;

  const fullSpan = displayP75 - displayP25;
  const effectiveSpan = fullSpan > 0 ? fullSpan : tierP75 - tierP25;
  const range = effectiveSpan > 0 ? effectiveSpan : 1;

  // Position roster on the 0-100 scale, clamped
  const rosterPos = Math.max(0, Math.min(100, ((displayRoster - displayP25) / range) * 100));
  const medianPos = Math.max(0, Math.min(100, ((displayMedian - displayP25) / range) * 100));

  const isBelow = displayRoster < displayMedian;
  const absGap = Math.abs(displayMedian - displayRoster);
  const gapRatio = range > 0 ? absGap / range : 0;

  let gapColor: string;
  let gapBg: string;
  let gapLabel: string;
  if (gapRatio < 0.05) {
    gapColor = 'text-emerald-400';
    gapBg = 'bg-emerald-500/30';
    gapLabel = 'Covered';
  } else if (gapRatio < 0.15) {
    gapColor = 'text-yellow-400';
    gapBg = 'bg-yellow-500/30';
    gapLabel = 'Slight Gap';
  } else if (gapRatio < 0.3) {
    gapColor = 'text-orange-400';
    gapBg = 'bg-orange-500/30';
    gapLabel = 'Notable Gap';
  } else {
    gapColor = 'text-red-400';
    gapBg = 'bg-red-500/40';
    gapLabel = 'Large Gap';
  }

  const left = Math.min(rosterPos, medianPos);
  const right = Math.max(rosterPos, medianPos);

  return (
    <div
      className={`group rounded-md -mx-1 px-1 py-0.5 transition-colors cursor-pointer ${
        onClick ? 'hover:bg-white/[0.03]' : ''
      } ${selected ? 'bg-neon-blue/[0.08] ring-1 ring-neon-blue/20' : ''}`}
      onClick={onClick}
      title={onClick ? 'Click to filter player recommendations by this stat gap' : undefined}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-slate-300 font-medium truncate max-w-[140px]" title={label}>
          {label}
          {selected && <span className="ml-1 text-[9px] text-neon-blue">●</span>}
        </span>
        <span className={`text-[10px] ${isBelow ? gapColor : 'text-emerald-400'}`}>
          {isBelow ? `${gapLabel}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 w-7 text-right shrink-0">
          {format(inverted ? displayP25 : tierP25)}
        </span>
        <div className="flex-1 h-4 rounded-full bg-dark-700 relative overflow-hidden min-w-[60px]">
          {/* Gray range bar from p25 to p75 */}
          {effectiveSpan > 0 && (
            <div className="absolute inset-0 bg-white/[0.04] rounded-full" />
          )}
          {/* Green fill: from roster to median (above median = strength) */}
          {!isBelow && left < right && (
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/30 rounded-full"
              style={{ left: `${left}%`, width: `${right - left}%` }}
            />
          )}
          {/* Red/orange fill: from roster to median (below median = gap) */}
          {isBelow && left < right && (
            <div
              className={`absolute top-0 bottom-0 ${gapBg} rounded-full`}
              style={{ left: `${left}%`, width: `${right - left}%` }}
            />
          )}
          {/* Tier median line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/40 pointer-events-none"
            style={{ left: `${medianPos}%` }}
          />
          {/* Roster composite marker */}
          <div
            className={`absolute top-0 bottom-0 w-1.5 rounded-sm pointer-events-none shadow-sm ${
              isBelow ? 'bg-red-400' : 'bg-emerald-400'
            }`}
            style={{ left: `${Math.max(0, rosterPos - 0.3)}%` }}
            title={`Roster: ${format(inverted ? rosterVal : rosterVal)}`}
          />
        </div>
        <span className="text-[9px] text-slate-500 w-7 text-left shrink-0">
          {format(inverted ? displayP75 : tierP75)}
        </span>
        <span className={`text-[11px] w-14 text-right shrink-0 font-semibold ${isBelow ? gapColor : 'text-emerald-400'}`}>
          {format(inverted ? rosterVal : rosterVal)}
        </span>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export default function Drafting({ players }: Props) {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [draftList, setDraftList] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<PlayerType>>(new Set());
  const [mode, setMode] = useState<StatMode>('regulation');
  const [deOnly, setDeOnly] = useState(false);
  const [cscPlayers, setCscPlayers] = useState<CscPlayer[]>([]);
  const [removedRosterIds, setRemovedRosterIds] = useState<Set<string>>(new Set());
  const [selectedGapStats, setSelectedGapStats] = useState<Set<keyof PlayerStats>>(new Set());
  const [gapAnalysisOpen, setGapAnalysisOpen] = useState(false);
  const [gapTopCount, setGapTopCount] = useState(10);

  useEffect(() => {
    Promise.all([
      fetchFranchises().catch(() => [] as Franchise[]),
      fetchAllPlayers().catch(() => [] as CscPlayer[]),
    ])
      .then(([franchiseData, cscData]) => {
        setFranchises(franchiseData ?? []);
        setCscPlayers(cscData ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const franchise = useMemo(
    () => franchises.find((f) => f.name === selectedFranchise) ?? null,
    [franchises, selectedFranchise],
  );

  const team = useMemo(
    () => franchise?.teams.find((t) => t.id === selectedTeamId) ?? null,
    [franchise, selectedTeamId],
  );

  const tier = team?.tier?.name ?? null;

  /* ── localStorage persistence ──────────────────────────────── */

  const storageKey = useMemo(() => {
    if (!selectedFranchise || !selectedTeamId) return null;
    return `fragg-draft-${selectedFranchise}-${selectedTeamId}`;
  }, [selectedFranchise, selectedTeamId]);

  useEffect(() => {
    if (!storageKey) {
      setDraftList([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((x: unknown) => typeof x === 'string')) {
          setDraftList(parsed);
        } else {
          setDraftList([]);
        }
      } else {
        setDraftList([]);
      }
    } catch {
      setDraftList([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(draftList));
    } catch { /* ignore quota */ }
  }, [draftList, storageKey]);

  const removedStorageKey = useMemo(() => {
    if (!selectedFranchise || !selectedTeamId) return null;
    return `fragg-roster-removed-${selectedFranchise}-${selectedTeamId}`;
  }, [selectedFranchise, selectedTeamId]);

  useEffect(() => {
    if (!removedStorageKey) {
      setRemovedRosterIds(new Set());
      return;
    }
    try {
      const stored = localStorage.getItem(removedStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((x: unknown) => typeof x === 'string')) {
          setRemovedRosterIds(new Set(parsed));
        } else {
          setRemovedRosterIds(new Set());
        }
      } else {
        setRemovedRosterIds(new Set());
      }
    } catch {
      setRemovedRosterIds(new Set());
    }
  }, [removedStorageKey]);

  useEffect(() => {
    if (!removedStorageKey) return;
    try {
      localStorage.setItem(removedStorageKey, JSON.stringify([...removedRosterIds]));
    } catch { /* ignore quota */ }
  }, [removedRosterIds, removedStorageKey]);

  /* ── Build player pool by tier ────────────────────────────────── */

  const playerMap = useMemo(() => {
    const m = new Map<string, GroupedPlayer>();
    for (const gp of players) m.set(gp.steamId, gp);
    return m;
  }, [players]);

  const availablePlayers = useMemo(() => {
    if (!tier) return [];
    const result: GroupedPlayer[] = [];
    for (const gp of players) {
      if (gp.cscTier !== tier) continue;
      const stats = getEntry(gp, mode);
      if (!stats || stats.games === 0) continue;
      result.push(gp);
    }
    return result;
  }, [players, tier, mode]);

  const tierPool = useMemo(() => {
    return availablePlayers
      .map((gp) => {
        const stats = getEntry(gp, mode);
        return stats ? { gp, stats } : null;
      })
      .filter((x): x is { gp: GroupedPlayer; stats: PlayerStats } => x !== null);
  }, [availablePlayers, mode]);

  /* ── Roster matching ─────────────────────────────────────────── */

  const cscTierMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of cscPlayers) {
      if (p.tier?.name && p.steam64Id) {
        m.set(p.steam64Id, p.tier.name);
      }
    }
    return m;
  }, [cscPlayers]);

  const rosterPlayers = useMemo((): FranchisePlayer[] => {
    return team?.players ?? [];
  }, [team]);

  const rosterGrouped = useMemo(() => {
    const result: {
      franchisePlayer: FranchisePlayer;
      grouped: GroupedPlayer | null;
      playerTier: string | null;
    }[] = [];
    for (const fp of rosterPlayers) {
      if (removedRosterIds.has(fp.steam64Id)) continue;
      const gp = playerMap.get(fp.steam64Id);
      const playerTier = cscTierMap.get(fp.steam64Id) ?? null;
      // Auto-filter: players whose tier no longer matches the team's tier
      if (playerTier && tier && playerTier !== tier) continue;
      result.push({ franchisePlayer: fp, grouped: gp ?? null, playerTier });
    }
    return result;
  }, [rosterPlayers, playerMap, cscTierMap, tier, removedRosterIds]);

  const tierMismatchedGrouped = useMemo(() => {
    const result: {
      franchisePlayer: FranchisePlayer;
      grouped: GroupedPlayer | null;
      playerTier: string | null;
      tierMismatch: 'higher' | 'lower' | null;
    }[] = [];
    for (const fp of rosterPlayers) {
      if (removedRosterIds.has(fp.steam64Id)) continue;
      const gp = playerMap.get(fp.steam64Id);
      const playerTier = cscTierMap.get(fp.steam64Id) ?? null;
      let tierMismatch: 'higher' | 'lower' | null = null;
      if (playerTier && tier && playerTier !== tier) {
        const playerIdx = ['recruit', 'prospect', 'contender', 'challenger', 'elite', 'premier'].indexOf(playerTier);
        const teamIdx = ['recruit', 'prospect', 'contender', 'challenger', 'elite', 'premier'].indexOf(tier);
        if (playerIdx > teamIdx) tierMismatch = 'higher';
        else if (playerIdx < teamIdx) tierMismatch = 'lower';
      }
      if (!tierMismatch) continue;
      result.push({ franchisePlayer: fp, grouped: gp ?? null, playerTier, tierMismatch });
    }
    return result;
  }, [rosterPlayers, playerMap, cscTierMap, tier, removedRosterIds]);

  const removedRosterGrouped = useMemo(() => {
    const result: {
      franchisePlayer: FranchisePlayer;
      grouped: GroupedPlayer | null;
    }[] = [];
    for (const fp of rosterPlayers) {
      if (!removedRosterIds.has(fp.steam64Id)) continue;
      const gp = playerMap.get(fp.steam64Id);
      result.push({ franchisePlayer: fp, grouped: gp ?? null });
    }
    return result;
  }, [rosterPlayers, playerMap, removedRosterIds]);

  const rosterStats = useMemo(() => {
    const result: PlayerStats[] = [];
    for (const { grouped } of rosterGrouped) {
      if (!grouped) continue;
      const s = getEntry(grouped, mode);
      if (s) result.push(s);
    }
    return result;
  }, [rosterGrouped, mode]);

  const rosterSteamIds = useMemo(
    () => new Set(rosterGrouped.map((r) => r.franchisePlayer.steam64Id)),
    [rosterGrouped],
  );

  const removeFromRoster = useCallback((steam64Id: string) => {
    setRemovedRosterIds((prev) => new Set([...prev, steam64Id]));
  }, []);

  const restoreToRoster = useCallback((steam64Id: string) => {
    setRemovedRosterIds((prev) => {
      const next = new Set(prev);
      next.delete(steam64Id);
      return next;
    });
  }, []);

  /* ── Archetypes & Skill Ratings ───────────────────────────────── */

  const archetypeAssignments = useMemo(
    () => assignArchetypes(tierPool),
    [tierPool],
  );

  const skillRatings = useMemo(
    () => computeSkillRatings(tierPool),
    [tierPool],
  );

  /* ── Gap Analysis ─────────────────────────────────────────────── */

  type GapAnalysis = {
    statKey: keyof PlayerStats;
    label: string;
    format: (v: number) => string;
    inverted?: boolean;
    rosterComposite: number;
    tierMedian: number;
    tierP25: number;
    tierP75: number;
    spread: number;
    rawGap: number;
    normalizedGap: number;
    rosterCount: number;
  };

  const rosterGapAnalysis = useMemo((): GapAnalysis[] | null => {
    if (rosterStats.length === 0 || tierPool.length === 0) return null;

    // Pre-sort tier values for each stat
    const tierSorted = new Map<keyof PlayerStats, number[]>();
    for (const field of GAP_STAT_FIELDS) {
      const arr: number[] = [];
      for (const { stats } of tierPool) {
        const v = Number(stats[field]);
        if (isNaN(v)) continue;
        arr.push(v);
      }
      arr.sort((a, b) => a - b);
      tierSorted.set(field, arr);
    }

    const results: GapAnalysis[] = [];

    for (const statDef of ALL_GAP_STATS) {
      const sorted = tierSorted.get(statDef.key) ?? [];

      // Roster composite: top 3 values
      const rosterVals: number[] = [];
      for (const s of rosterStats) {
        const v = Number(s[statDef.key]);
        if (!isNaN(v)) rosterVals.push(v);
      }
      rosterVals.sort((a, b) => b - a);
      const topVals = rosterVals.slice(0, 3);
      const rosterComposite = topVals.length > 0
        ? topVals.reduce((a, b) => a + b, 0) / topVals.length
        : 0;

      const tierMedian = medianSorted(sorted);
      const tierP25 = percentile(sorted, 25);
      const tierP75 = percentile(sorted, 75);
      const spread = Math.max(tierP75 - tierP25, 0.001);

      const rawGap = statDef.inverted
        ? Math.max(0, rosterComposite - tierMedian)
        : Math.max(0, tierMedian - rosterComposite);

      const normalizedGap = spread > 0 ? rawGap / spread : 0;

      results.push({
        statKey: statDef.key,
        label: statDef.label,
        format: statDef.format,
        inverted: statDef.inverted,
        rosterComposite,
        tierMedian,
        tierP25,
        tierP75,
        spread,
        rawGap,
        normalizedGap,
        rosterCount: topVals.length,
      });
    }

    return results;
  }, [rosterStats, tierPool]);

  const gapRecommendations = useMemo(() => {
    if (!rosterGapAnalysis || tierPool.length === 0) return [];

    const filterActive = selectedGapStats.size > 0;

    const gapMap = new Map<keyof PlayerStats, number>();
    let totalGap = 0;
    for (const gap of rosterGapAnalysis) {
      if (filterActive && !selectedGapStats.has(gap.statKey)) continue;
      gapMap.set(gap.statKey, gap.normalizedGap);
      totalGap += gap.normalizedGap;
    }
    if (totalGap <= 0) return [];

    // Only consider available players not on roster and not drafted
    const draftSet = new Set(draftList);
    const candidatePool = tierPool.filter(
      ({ gp }) => !rosterSteamIds.has(gp.steamId) && !draftSet.has(gp.steamId) && (!deOnly || gp.cscPlayerType === 'DRAFT_ELIGIBLE'),
    );
    const scored = candidatePool.map(({ gp, stats }) => {
      let weightedImprovement = 0;
      let weightedGap = 0;
      const improvements: { key: keyof PlayerStats; label: string; improvement: number }[] = [];

      for (const gap of rosterGapAnalysis) {
        if (filterActive && !selectedGapStats.has(gap.statKey)) continue;
        if (gap.normalizedGap <= 0.05) continue;
        const playerVal = Number(stats[gap.statKey]);
        if (isNaN(playerVal)) continue;

        let improvement: number;
        if (gap.inverted) {
          improvement = gap.rosterComposite - playerVal;
        } else {
          improvement = playerVal - gap.rosterComposite;
        }
        improvement = Math.max(0, improvement);
        // Normalize improvement by spread so units match
        const normImprovement = improvement / gap.spread;

        weightedImprovement += normImprovement * gap.normalizedGap;
        weightedGap += gap.normalizedGap;

        if (improvement > 0) {
          improvements.push({ key: gap.statKey, label: gap.label, improvement });
        }
      }

      const gapScore = weightedGap > 0 ? (weightedImprovement / weightedGap) * 100 : 0;

      // Sort improvements by impact
      improvements.sort((a, b) => b.improvement - a.improvement);

      return { gp, gapScore, improvements: improvements.slice(0, 8) };
    });

    scored.sort((a, b) => b.gapScore - a.gapScore);

    // Normalize scores to 0-100 via percentile
    const allScores = scored.map((s) => s.gapScore).sort((a, b) => a - b);
    for (const s of scored) {
      const pct = allScores.length > 0
        ? (allScores.filter((v) => v < s.gapScore).length / allScores.length) * 100
        : 50;
      s.gapScore = Math.round(pct);
    }

    return scored;
  }, [rosterGapAnalysis, tierPool, draftList, rosterSteamIds, selectedGapStats, deOnly]);

  /* ── Filtered & Sorted Available Players ──────────────────────── */

  const availableTypes = useMemo(() => {
    const types = new Set<PlayerType>();
    for (const gp of availablePlayers) {
      if (gp.cscPlayerType) types.add(gp.cscPlayerType as PlayerType);
    }
    return [...types].sort();
  }, [availablePlayers]);

  const filteredPlayers = useMemo(() => {
    let result = availablePlayers;
    if (selectedTypes.size > 0) {
      result = result.filter((gp) => gp.cscPlayerType && selectedTypes.has(gp.cscPlayerType as PlayerType));
    }
    const q = search.toLowerCase();
    return result.filter((gp) => gp.name.toLowerCase().includes(q));
  }, [availablePlayers, search, selectedTypes]);

  /* ── Draft list ───────────────────────────────────────────────── */

  const draftPlayers = useMemo(() => {
    const draftSet = new Set(draftList);
    const result: GroupedPlayer[] = [];
    for (const gp of players) {
      if (draftSet.has(gp.steamId)) result.push(gp);
    }
    return result.sort((a, b) => {
      const sa = getEntry(a, mode)?.finalRating ?? 0;
      const sb = getEntry(b, mode)?.finalRating ?? 0;
      return sb - sa;
    });
  }, [players, draftList, mode]);

  const draftArchetypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const gp of draftPlayers) {
      const arch = archetypeAssignments.get(gp.steamId);
      if (arch) {
        const name = ARCHETYPE_BY_ID.get(arch.primary.archetypeId)?.name ?? 'Unknown';
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [draftPlayers, archetypeAssignments]);

  const addToDraft = useCallback((steamId: string) => {
    setDraftList((prev) => [...prev, steamId]);
  }, []);

  const removeFromDraft = useCallback((steamId: string) => {
    setDraftList((prev) => prev.filter((id) => id !== steamId));
  }, []);

  const clearDraft = useCallback(() => setDraftList([]), []);

  const toggleType = useCallback((type: PlayerType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      if (next.size === availableTypes.length) return new Set();
      return next;
    });
  }, [availableTypes]);

  const teamsWithTiers = useMemo(() => {
    if (!franchise) return [];
    return franchise.teams.map((t) => ({
      ...t,
      tierName: t.tier?.name ?? 'Unknown',
    }));
  }, [franchise]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-slate-400">Loading franchises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5 animate-in">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Drafting</h1>
          <p className="text-sm text-slate-400 mt-1">Select your franchise and tier to build a draft list</p>
        </div>
        <div className="flex-1" />
        <ModeToggle mode={mode} onChange={setMode} />
        {draftList.length > 0 && (
          <button
            onClick={clearDraft}
            className="px-4 py-2 rounded-lg text-sm bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors cursor-pointer"
          >
            Clear Draft ({draftList.length})
          </button>
        )}
      </div>

      {/* ── Selectors ───────────────────────────────── */}
      <div className="glass rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Franchise</label>
            <select
              value={selectedFranchise}
              onChange={(e) => {
                setSelectedFranchise(e.target.value);
                setSelectedTeamId('');
              }}
              className="w-full appearance-none bg-dark-800/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 border border-white/10 hover:border-accent/30 focus:border-accent/50 focus:outline-none cursor-pointer"
            >
              <option value="">Select a franchise...</option>
              {franchises.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.prefix ? `[${f.prefix}] ` : ''}{f.name}
                </option>
              ))}
            </select>
          </div>

          {franchise && (
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Team & Tier</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full appearance-none bg-dark-800/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 border border-white/10 hover:border-accent/30 focus:border-accent/50 focus:outline-none cursor-pointer"
              >
                <option value="">Select a team...</option>
                {teamsWithTiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.tierName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {tier && (
            <div className="flex items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
                <Sparkles size={14} />
                Tier: {tier}
              </span>
            </div>
          )}
        </div>
      </div>

      {!tier && (
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🏗️</div>
          <p className="text-slate-400 text-lg">Select a franchise and team to see available players in that tier</p>
        </div>
      )}

      {tier && (
        <div className="space-y-6">
          {/* ── Current Roster ──────────────────────── */}
          {rosterPlayers.length > 0 && (
            <div className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                <Users size={16} className="text-neon-blue" />
                <span className="text-sm font-semibold text-slate-200">Current Roster</span>
                <span className="text-xs text-slate-500">
                  — {rosterGrouped.filter((r) => r.grouped && getEntry(r.grouped, mode)).length}
                  /{rosterGrouped.length} active have {mode} stats
                </span>
                {removedRosterIds.size > 0 && (
                  <span className="text-xs text-slate-600">
                    · {removedRosterIds.size} removed
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-400">
                      <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider">Player</th>
                      <th className="text-left px-2 py-2.5 font-medium uppercase tracking-wider">Type</th>
                      <th className="text-left px-2 py-2.5 font-medium uppercase tracking-wider">Tier</th>
                      <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">Rating</th>
                      <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">HLTV</th>
                      <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">K/D</th>
                      <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">ADR</th>
                      <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">G</th>
                      <th className="text-left px-2 py-2.5 font-medium uppercase tracking-wider">Archetype</th>
                      <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">Skill</th>
                      <th className="text-center px-2 py-2.5 font-medium uppercase tracking-wider">MMR</th>
                      <th className="text-center px-2 py-2.5 font-medium uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterGrouped.map(({ franchisePlayer, grouped, playerTier }) => {
                      const s = grouped ? getEntry(grouped, mode) : null;
                      const arch = grouped ? archetypeAssignments.get(grouped.steamId) : null;
                      const skill = grouped ? skillRatings.get(grouped.steamId) : null;
                      const archDef = arch ? ARCHETYPE_BY_ID.get(arch.primary.archetypeId) : null;
                      if (!s) {
                        return (
                          <tr key={franchisePlayer.steam64Id} className="border-b border-white/[0.02]">
                            <td className="px-4 py-2.5 text-slate-400">{franchisePlayer.name}</td>
                            <td className="px-2 py-2.5"><span className="text-xs text-slate-600">—</span></td>
                            <td className="px-2 py-2.5">
                              {playerTier ? (
                                <span className="text-xs px-1.5 py-0.5 rounded-full border bg-neon-blue/10 text-neon-blue border-neon-blue/20">
                                  {playerTier}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-600">—</span>
                              )}
                            </td>
                            <td colSpan={8} className="px-2 py-2.5">
                              {grouped && !s ? (
                                <span className="text-xs text-slate-500">No {mode} stats</span>
                              ) : (
                                <span className="text-xs text-slate-600">No FRAGG data</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <button
                                onClick={() => removeFromRoster(franchisePlayer.steam64Id)}
                                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                                title="Remove from roster (planning)"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr
                          key={franchisePlayer.steam64Id}
                          className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <a
                              href={`/players/${grouped!.steamId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-slate-200 hover:text-accent transition-colors"
                            >
                              {franchisePlayer.name}
                              <ExternalLink size={12} className="opacity-40" />
                            </a>
                          </td>
                          <td className="px-2 py-2.5">
                            {grouped!.cscPlayerType ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getPlayerTypeColor(grouped!.cscPlayerType as PlayerType)}`}>
                                {getPlayerTypeLabel(grouped!.cscPlayerType as PlayerType)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            {playerTier ? (
                              <span className="text-xs px-1.5 py-0.5 rounded-full border bg-neon-blue/10 text-neon-blue border-neon-blue/20">
                                {playerTier}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className={`px-2 py-2.5 text-right font-semibold ${getStatColor(s.finalRating, statRanges.hltvRating)}`}>
                            {s.finalRating.toFixed(3)}
                          </td>
                          <td className={`px-2 py-2.5 text-right ${getStatColor(s.hltvRating, statRanges.hltvRating)}`}>
                            {s.hltvRating.toFixed(2)}
                          </td>
                          <td className={`px-2 py-2.5 text-right ${getStatColor(kd(s.kills, s.deaths), statRanges.kdRatio)}`}>
                            {kd(s.kills, s.deaths).toFixed(2)}
                          </td>
                          <td className={`px-2 py-2.5 text-right ${getStatColor(s.adr, statRanges.adr)}`}>
                            {s.adr.toFixed(1)}
                          </td>
                          <td className="px-2 py-2.5 text-right text-slate-400">{s.games}</td>
                          <td className="px-2 py-2.5">
                            {archDef ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${archDef.textClass} ${archDef.bgClass} ${archDef.borderClass}`}>
                                {archDef.name}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            {skill ? (
                              <span className={`text-xs font-semibold ${
                                skill.skillRating >= 80 ? 'text-emerald-400' :
                                skill.skillRating >= 60 ? 'text-neon-blue' :
                                skill.skillRating >= 40 ? 'text-yellow-400' :
                                'text-slate-500'
                              }`}>
                                {Math.round(skill.skillRating)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-right text-xs text-slate-400">
                            {franchisePlayer.mmr > 0 ? franchisePlayer.mmr : '—'}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <button
                              onClick={() => removeFromRoster(franchisePlayer.steam64Id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                              title="Remove from roster (planning)"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {rosterGrouped.length === 0 && (
                      <tr>
                        <td colSpan={12} className="px-4 py-6 text-center text-slate-500 text-sm">
                          All roster players removed or tier-mismatched — see sections below
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Tier Mismatch (auto-filtered) ───── */}
              {tierMismatchedGrouped.length > 0 && (
                <div className="border-t border-orange-500/30">
                  <div className="px-5 py-2.5 flex items-center gap-2 bg-orange-500/[0.04]">
                    <AlertTriangle size={14} className="text-orange-400" />
                    <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">
                      Tier Mismatch ({tierMismatchedGrouped.length})
                    </span>
                    <span className="text-[10px] text-slate-600">
                      — these players' tier no longer matches {tier}, excluded from active roster
                    </span>
                  </div>
                  <div className="px-3 pb-2 pt-1 flex flex-wrap gap-2">
                    {tierMismatchedGrouped.map(({ franchisePlayer, grouped, playerTier, tierMismatch }) => {
                      const s = grouped ? getEntry(grouped, mode) : null;
                      const mismatchLabel = tierMismatch === 'higher'
                        ? `⬆ promoted to ${playerTier}`
                        : `⬇ demoted to ${playerTier}`;
                      return (
                        <div
                          key={franchisePlayer.steam64Id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-orange-500/20 text-sm"
                        >
                          <span className="text-slate-300">{franchisePlayer.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-400 border border-orange-400/20">
                            {mismatchLabel}
                          </span>
                          {s && (
                            <span className={`text-xs ${getStatColor(s.finalRating, statRanges.hltvRating)}`}>
                              {s.finalRating.toFixed(3)}
                            </span>
                          )}
                          <button
                            onClick={() => removeFromRoster(franchisePlayer.steam64Id)}
                            className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                            title="Acknowledge and remove"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Removed Players ──────────────── */}
              {removedRosterGrouped.length > 0 && (
                <div className="border-t border-white/5">
                  <div className="px-5 py-2.5 flex items-center gap-2 bg-dark-800/30">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Removed Players ({removedRosterGrouped.length})
                    </span>
                    <span className="text-[10px] text-slate-600">
                      — excluded from roster display and gap analysis
                    </span>
                  </div>
                  <div className="px-3 pb-2 pt-1 flex flex-wrap gap-2">
                    {removedRosterGrouped.map(({ franchisePlayer, grouped }) => {
                      const s = grouped ? getEntry(grouped, mode) : null;
                      return (
                        <div
                          key={franchisePlayer.steam64Id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-white/[0.04] text-sm"
                        >
                          <span className="text-slate-400">{franchisePlayer.name}</span>
                          {s && (
                            <span className={`text-xs ${getStatColor(s.finalRating, statRanges.hltvRating)}`}>
                              {s.finalRating.toFixed(3)}
                            </span>
                          )}
                          <button
                            onClick={() => restoreToRoster(franchisePlayer.steam64Id)}
                            className="flex items-center gap-1 text-xs text-neon-blue hover:text-neon-cyan transition-colors cursor-pointer"
                            title="Restore to active roster"
                          >
                            <Undo2 size={12} />
                            Restore
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Roster Gap Analysis ─────────────────── */}
          {rosterGapAnalysis && rosterGapAnalysis.length > 0 && (
            <div className="glass rounded-xl overflow-hidden card-glow">
              <button
                onClick={() => setGapAnalysisOpen(!gapAnalysisOpen)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <BarChart3 size={18} className="text-neon-blue opacity-80" />
                <span className="text-sm font-semibold text-slate-200 flex-1">Roster Gap Analysis</span>
                <span className="text-xs text-slate-500">
                  {rosterStats.length} roster players with {mode} stats · {rosterGapAnalysis.filter((g) => g.normalizedGap >= 0.3).length} significant gaps
                </span>
                {gapAnalysisOpen ? (
                  <ChevronUp size={18} className="text-slate-500" />
                ) : (
                  <ChevronDown size={18} className="text-slate-500" />
                )}
              </button>

              {gapAnalysisOpen && (
                <div className="px-5 pb-5 animate-in">
                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1.5 rounded-sm bg-dark-700 border border-white/10" />
                      p25–p75 range
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-0.5 h-4 bg-white/40" />
                      tier median
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-4 rounded-sm bg-emerald-400" />
                      roster ≥ median (strength)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-4 rounded-sm bg-red-400" />
                      roster &lt; median (gap)
                    </span>
                  </div>

                  {/* Gap Filter Indicator */}
                  {selectedGapStats.size > 0 && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-neon-blue/[0.06] border border-neon-blue/15">
                      <span className="text-[11px] text-neon-blue font-medium">
                        Filtering by {selectedGapStats.size} gap{selectedGapStats.size > 1 ? 's' : ''}:
                      </span>
                      <span className="text-[11px] text-neon-blue/70">
                        {[...selectedGapStats].map((k) => {
                          const def = GAP_STAT_MAP.get(k);
                          return def?.label ?? k;
                        }).join(', ')}
                      </span>
                      <button
                        onClick={() => setSelectedGapStats(new Set())}
                        className="ml-auto text-[10px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}

                  {/* Quick Summary */}
                  {(() => {
                    const sorted = [...rosterGapAnalysis].sort((a, b) => b.normalizedGap - a.normalizedGap);
                    const critical = sorted.filter((g) => g.normalizedGap >= 0.3).slice(0, 5);
                    const strengths = sorted
                      .filter((g) => g.normalizedGap < 0.05 && g.rosterCount >= 1)
                      .sort((a, b) => a.normalizedGap - b.normalizedGap)
                      .slice(0, 5);
                    return (
                      <div className="flex flex-wrap items-start gap-x-6 gap-y-1 mb-4">
                        {critical.length > 0 && (
                          <div>
                            <span className="text-[11px] text-red-400 font-semibold">Critical Gaps: </span>
                            {critical.map((g, i) => (
                              <span key={g.statKey} className="text-[11px] text-red-400/80">
                                {g.label}{i < critical.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                        {strengths.length > 0 && (
                          <div>
                            <span className="text-[11px] text-emerald-400 font-semibold">Strengths: </span>
                            {strengths.map((g, i) => (
                              <span key={g.statKey} className="text-[11px] text-emerald-400/80">
                                {g.label}{i < strengths.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Gap Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                    {GAP_STAT_GROUPS.map((group) => {
                      const groupGaps = rosterGapAnalysis.filter((g) =>
                        group.stats.some((s) => s.key === g.statKey),
                      );
                      const hasGaps = groupGaps.some((g) => g.normalizedGap >= 0.1);
                      return (
                        <div key={group.group} className="bg-dark-800/40 rounded-lg p-3 border border-white/[0.04]">
                          <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                            <span className={`w-1.5 h-3 rounded-full ${
                              hasGaps ? 'bg-yellow-500' : 'bg-emerald-500'
                            }`} />
                            {group.group}
                          </h4>
                          <div className="space-y-1">
                            {groupGaps.map((g) => (
                              <GapBar
                                key={g.statKey}
                                label={g.label}
                                rosterVal={g.rosterComposite}
                                tierMedian={g.tierMedian}
                                tierP25={g.tierP25}
                                tierP75={g.tierP75}
                                spread={g.spread}
                                inverted={g.inverted}
                                format={g.format}
                                selected={selectedGapStats.has(g.statKey)}
                                onClick={() => {
                                  setSelectedGapStats((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(g.statKey)) next.delete(g.statKey);
                                    else next.add(g.statKey);
                                    return next;
                                  });
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Top Recommendations */}
                  {gapRecommendations.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-neon-blue flex items-center gap-2">
                          <TrendingUp size={16} />
                          Top Gap-Filling Players
                        </h4>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={deOnly}
                              onChange={(e) => setDeOnly(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-slate-500 bg-dark-700 accent-neon-cyan cursor-pointer"
                            />
                            DE only
                          </label>
                          <span className="text-xs text-slate-500">Show</span>
                          {[5, 10, 20].map((n) => (
                            <button
                              key={n}
                              onClick={() => setGapTopCount(n)}
                              className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                                gapTopCount === n
                                  ? 'bg-accent/20 text-accent border border-accent/30'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/5 text-xs text-slate-400">
                              <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Player</th>
                              <th className="text-left px-2 py-2 font-medium uppercase tracking-wider">Type</th>
                              <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Archetype</th>
                              <th className="text-right px-2 py-2 font-medium uppercase tracking-wider">G</th>
                              <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Rating</th>
                              <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Skill</th>
                              <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Gap Score</th>
                              <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Fills Gaps In</th>
                              <th className="text-center px-3 py-2 font-medium uppercase tracking-wider">Draft</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gapRecommendations.slice(0, gapTopCount).map(({ gp, gapScore, improvements }) => {
                              const s = getEntry(gp, mode);
                              if (!s) return null;
                              const arch = archetypeAssignments.get(gp.steamId);
                              const archDef = arch ? ARCHETYPE_BY_ID.get(arch.primary.archetypeId) : null;
                              const skill = skillRatings.get(gp.steamId);
                              return (
                                <tr
                                  key={gp.steamId}
                                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                                >
                                  <td className="px-3 py-2">
                                    <a
                                      href={`/players/${gp.steamId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-medium text-slate-200 hover:text-accent transition-colors text-xs"
                                    >
                                      {gp.name}
                                      <ExternalLink size={11} className="opacity-40" />
                                      </a>
                                  </td>
                                  <td className="px-2 py-2">
                                    {gp.cscPlayerType ? (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getPlayerTypeColor(gp.cscPlayerType as PlayerType)}`}>
                                        {getPlayerTypeLabel(gp.cscPlayerType as PlayerType)}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-600">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {archDef ? (
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full border ${archDef.textClass} ${archDef.bgClass} ${archDef.borderClass}`}>
                                        {archDef.name}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-600">—</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-right text-xs text-slate-400">{s.games}</td>
                                  <td className={`px-3 py-2 text-right font-semibold text-xs ${getStatColor(s.finalRating, statRanges.hltvRating)}`}>
                                    {s.finalRating.toFixed(3)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-xs">
                                    {skill ? (
                                      <span className={`font-semibold ${
                                        skill.skillRating >= 80 ? 'text-emerald-400' :
                                        skill.skillRating >= 60 ? 'text-neon-blue' :
                                        skill.skillRating >= 40 ? 'text-yellow-400' :
                                        'text-slate-500'
                                      }`}>
                                        {Math.round(skill.skillRating)}
                                      </span>
                                    ) : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className={`text-xs font-bold ${
                                      gapScore >= 80 ? 'text-emerald-400' :
                                      gapScore >= 60 ? 'text-neon-blue' :
                                      gapScore >= 40 ? 'text-yellow-400' :
                                      'text-slate-500'
                                    }`}>
                                      {gapScore}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                      {improvements.map((imp) => (
                                        <span
                                          key={imp.key}
                                          className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20"
                                        >
                                          {imp.label}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {draftList.includes(gp.steamId) ? (
                                      <button
                                        onClick={() => removeFromDraft(gp.steamId)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-red-400/10 hover:text-red-400 transition-colors cursor-pointer"
                                      >
                                        <X size={11} />
                                        Remove
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => addToDraft(gp.steamId)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer"
                                      >
                                        <Plus size={11} />
                                        Add
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Available Players + Draft List ─────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Available Players ───────────────── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-dark-800/60 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 border border-white/5 focus:border-accent/40 focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {filteredPlayers.length} of {availablePlayers.length} players
                  </span>
                </div>

                {availableTypes.length > 0 && (
                  <div className="px-5 py-2.5 border-b border-white/5 flex flex-wrap items-center gap-2">
                    <Filter size={14} className="text-slate-500" />
                    {availableTypes.map((type) => {
                      const active = selectedTypes.size === 0 || selectedTypes.has(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                            active
                              ? `${getPlayerTypeColor(type)}`
                              : 'text-slate-600 bg-dark-700/50 border-white/5'
                          }`}
                        >
                          {getPlayerTypeLabel(type)}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-slate-400">
                        <th className="text-left px-3 py-2.5 font-medium uppercase tracking-wider">Player</th>
                        <th className="text-left px-2 py-2.5 font-medium uppercase tracking-wider">Type</th>
                        <th className="text-left px-2 py-2.5 font-medium uppercase tracking-wider">Archetype</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">Skill</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">G</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">Rating</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">HLTV</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">K/D</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">ADR</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">KPR</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">HS%</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">KAST</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">Open%</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">Trade</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">T Rat</th>
                        <th className="text-right px-2 py-2.5 font-medium uppercase tracking-wider">CT Rat</th>
                        <th className="text-center px-2 py-2.5 font-medium uppercase tracking-wider">Draft</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlayers.map((gp) => {
                        const s = getEntry(gp, mode);
                        if (!s) return null;
                        const arch = archetypeAssignments.get(gp.steamId);
                        const archDef = arch ? ARCHETYPE_BY_ID.get(arch.primary.archetypeId) : null;
                        const skill = skillRatings.get(gp.steamId);
                        const kdr = kd(s.kills, s.deaths);
                        const isRostered = rosterSteamIds.has(gp.steamId);
                        return (
                          <tr
                            key={gp.steamId}
                            className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors ${
                              isRostered ? 'bg-neon-blue/[0.03]' : ''
                            }`}
                          >
                            <td className="px-3 py-2">
                              <a
                                href={`/players/${gp.steamId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-slate-200 hover:text-accent transition-colors text-xs"
                              >
                                {gp.name}
                                <ExternalLink size={11} className="opacity-40" />
                              </a>
                              {isRostered && (
                                <span className="ml-1 text-[10px] text-neon-blue/60">(roster)</span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              {gp.cscPlayerType ? (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getPlayerTypeColor(gp.cscPlayerType as PlayerType)}`}>
                                  {getPlayerTypeLabel(gp.cscPlayerType as PlayerType)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              {archDef ? (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${archDef.textClass} ${archDef.bgClass} ${archDef.borderClass}`}>
                                  {archDef.name}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {skill ? (
                                <span className={`text-xs font-semibold ${
                                  skill.skillRating >= 80 ? 'text-emerald-400' :
                                  skill.skillRating >= 60 ? 'text-neon-blue' :
                                  skill.skillRating >= 40 ? 'text-yellow-400' :
                                  'text-slate-500'
                                }`}>
                                  {Math.round(skill.skillRating)}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-2 py-2 text-right text-xs text-slate-400">{s.games}</td>
                            <td className={`px-2 py-2 text-right font-semibold text-xs ${getStatColor(s.finalRating, statRanges.hltvRating)}`}>
                              {s.finalRating.toFixed(3)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.hltvRating, statRanges.hltvRating)}`}>
                              {s.hltvRating.toFixed(2)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(kdr, statRanges.kdRatio)}`}>
                              {kdr.toFixed(2)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.adr, statRanges.adr)}`}>
                              {s.adr.toFixed(1)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.kpr, statRanges.kpr)}`}>
                              {s.kpr.toFixed(2)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.headshotPct, statRanges.headshotPct)}`}>
                              {pctStr(s.headshotPct)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.kast, statRanges.kast)}`}>
                              {pctStr(s.kast)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.openingSuccessPct, statRanges.openingSuccessPct)}`}>
                              {pctStr(s.openingSuccessPct)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.tradeKillsPerRound, statRanges.tradeKillsPerRound)}`}>
                              {s.tradeKillsPerRound.toFixed(3)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.tRating, statRanges.tRating)}`}>
                              {s.tRating.toFixed(2)}
                            </td>
                            <td className={`px-2 py-2 text-right text-xs ${getStatColor(s.ctRating, statRanges.ctRating)}`}>
                              {s.ctRating.toFixed(2)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {isRostered ? (
                                <span className="text-[10px] text-slate-500 italic">on roster</span>
                              ) : draftList.includes(gp.steamId) ? (
                                <button
                                  onClick={() => removeFromDraft(gp.steamId)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-red-400/10 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <X size={11} />
                                  Remove
                                </button>
                              ) : (
                                <button
                                  onClick={() => addToDraft(gp.steamId)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer"
                                >
                                  <Plus size={11} />
                                  Add
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredPlayers.length === 0 && (
                        <tr>
                          <td colSpan={17} className="px-4 py-8 text-center text-slate-500">
                            {availablePlayers.length === 0
                              ? `No players found in tier "${tier}" with ${mode} stats`
                              : 'No players match your search'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Draft List ─────────────────────── */}
            <div className="lg:col-span-1">
              <div className="glass rounded-xl overflow-hidden sticky top-20">
                <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-400" />
                  <span className="text-sm font-semibold text-slate-200">Draft List</span>
                  {draftPlayers.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      {draftPlayers.length}
                    </span>
                  )}
                </div>

                {draftPlayers.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    <GripVertical size={24} className="mx-auto mb-2 text-slate-600" />
                    Click <span className="text-accent font-medium">Add</span> to build your draft list
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto">
                      {draftPlayers.map((gp, idx) => {
                        const s = getEntry(gp, mode);
                        const arch = archetypeAssignments.get(gp.steamId);
                        const archDef = arch ? ARCHETYPE_BY_ID.get(arch.primary.archetypeId) : null;
                        const skill = skillRatings.get(gp.steamId);
                        if (!s) return null;
                        const kdr = kd(s.kills, s.deaths);
                        return (
                          <div key={gp.steamId} className="px-5 py-3 group hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-mono text-slate-600 w-5">{idx + 1}</span>
                                <a
                                  href={`/players/${gp.steamId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-slate-200 hover:text-accent transition-colors truncate flex items-center gap-1"
                                >
                                  {gp.name}
                                  <ExternalLink size={11} className="opacity-40 flex-shrink-0" />
                                </a>
                              </div>
                              <button
                                onClick={() => removeFromDraft(gp.steamId)}
                                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                              {archDef && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${archDef.textClass} ${archDef.bgClass} ${archDef.borderClass}`}>
                                  {archDef.name}
                                </span>
                              )}
                              {gp.cscPlayerType && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getPlayerTypeColor(gp.cscPlayerType as PlayerType)}`}>
                                  {getPlayerTypeLabel(gp.cscPlayerType as PlayerType)}
                                </span>
                              )}
                              {skill && (
                                <span className={`text-[10px] font-semibold ${
                                  skill.skillRating >= 80 ? 'text-emerald-400' :
                                  skill.skillRating >= 60 ? 'text-neon-blue' :
                                  skill.skillRating >= 40 ? 'text-yellow-400' :
                                  'text-slate-500'
                                }`}>
                                  Skill {Math.round(skill.skillRating)}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                              <div className="text-xs">
                                <span className="text-slate-500">Rating</span>
                                <span className={`ml-1 font-semibold ${getStatColor(s.finalRating, statRanges.hltvRating)}`}>
                                  {s.finalRating.toFixed(3)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">HLTV</span>
                                <span className={`ml-1 ${getStatColor(s.hltvRating, statRanges.hltvRating)}`}>
                                  {s.hltvRating.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">K/D</span>
                                <span className={`ml-1 ${getStatColor(kdr, statRanges.kdRatio)}`}>
                                  {kdr.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">ADR</span>
                                <span className={`ml-1 ${getStatColor(s.adr, statRanges.adr)}`}>
                                  {s.adr.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">KAST</span>
                                <span className={`ml-1 ${getStatColor(s.kast, statRanges.kast)}`}>
                                  {pctStr(s.kast)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">Gms</span>
                                <span className="ml-1 text-slate-400">{s.games}</span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">Open%</span>
                                <span className={`ml-1 ${getStatColor(s.openingSuccessPct, statRanges.openingSuccessPct)}`}>
                                  {pctStr(s.openingSuccessPct)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">Trade</span>
                                <span className={`ml-1 ${getStatColor(s.tradeKillsPerRound, statRanges.tradeKillsPerRound)}`}>
                                  {s.tradeKillsPerRound.toFixed(3)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">Util</span>
                                <span className={`ml-1 ${getStatColor(s.utilityDamagePerRound, statRanges.utilityDamagePerRound)}`}>
                                  {s.utilityDamagePerRound.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">T Rat</span>
                                <span className={`ml-1 ${getStatColor(s.tRating, statRanges.tRating)}`}>
                                  {s.tRating.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">CT Rat</span>
                                <span className={`ml-1 ${getStatColor(s.ctRating, statRanges.ctRating)}`}>
                                  {s.ctRating.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">Clutch</span>
                                <span className={`ml-1 ${getStatColor(s.clutchPointsPerRound, statRanges.clutchPointsPerRound)}`}>
                                  {s.clutchPointsPerRound.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Team Comp Summary */}
                    <div className="px-5 py-3 border-t border-white/5">
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                        <Users size={12} />
                        Team Composition
                      </div>
                      {draftArchetypeCounts.length === 0 ? (
                        <span className="text-xs text-slate-500">No archetype data available</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {draftArchetypeCounts.map(([name, count]) => {
                            const def = ARCHETYPE_BY_ID.get([...ARCHETYPE_BY_ID.entries()].find(([, a]) => a.name === name)?.[0] ?? '');
                            return (
                              <span
                                key={name}
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                  def ? `${def.textClass} ${def.bgClass} ${def.borderClass}` : 'text-slate-400 bg-slate-400/10 border-slate-400/20'
                                }`}
                              >
                                {count}× {name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {draftPlayers.length > 0 && (
                        <div className="text-xs text-slate-400 mt-2">
                          Avg rating:{' '}
                          <span className="text-accent font-semibold">
                            {(() => {
                              const ratings = draftPlayers
                                .filter((p) => getEntry(p, mode) != null)
                                .map((p) => getEntry(p, mode)!.finalRating);
                              if (ratings.length === 0) return '—';
                              return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(3);
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
