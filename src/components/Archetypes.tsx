import { useState, useMemo } from 'react';
import {
  ChevronRight,
  Users,
  Sparkles,
  Filter,
} from 'lucide-react';
import type { GroupedPlayer, PlayerStats, StatMode } from '../types';
import {
  ARCHETYPES,
  ARCHETYPE_BY_ID,
  assignArchetypes,
  computeSkillRatings,
  type Archetype,
} from '../archetypes';
import ModeToggle from './ModeToggle';
import PlayerArchetypeModal from './PlayerArchetypeModal';
import { statRanges, getStatColor } from '../statRanges';

interface Props {
  players: GroupedPlayer[];
}

interface PlayerInGroup {
  gp: GroupedPlayer;
  stats: PlayerStats;
  score: number;
  secondary: { id: string; score: number } | null;
}

const MIN_GAMES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10];

// CSC tier ordering (lowest -> highest), matches PlayerList convention.
const CSC_TIER_ORDER = ['recruit', 'prospect', 'contender', 'challenger', 'elite', 'premier'];

function tierRank(tier: string): number {
  const idx = CSC_TIER_ORDER.indexOf(tier.toLowerCase());
  return idx === -1 ? CSC_TIER_ORDER.length : idx;
}

function getBestEntry(gp: GroupedPlayer, mode: StatMode): PlayerStats | null {
  return gp[mode];
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 65) return 'text-neon-blue';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 35) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 65) return 'bg-neon-blue';
  if (score >= 50) return 'bg-yellow-400';
  if (score >= 35) return 'bg-orange-400';
  return 'bg-red-400';
}

// -----------------------------------------------------------------------------
// Player card
// -----------------------------------------------------------------------------

interface PlayerCardProps {
  entry: PlayerInGroup;
  arch: Archetype;
  onSelect: (entry: PlayerInGroup) => void;
}

function PlayerCard({ entry, arch, onSelect }: PlayerCardProps) {
  const { gp, stats, score, secondary } = entry;
  const secondaryArch = secondary ? ARCHETYPE_BY_ID.get(secondary.id) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={`group glass rounded-xl p-4 card-glow text-left w-full border ${arch.borderClass} hover:scale-[1.01] transition-all cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-slate-100 truncate group-hover:text-neon-blue transition-colors">
              {gp.name}
            </span>
            <ChevronRight
              size={14}
              className="text-slate-500 group-hover:text-neon-blue transition-colors flex-shrink-0"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 truncate">{stats.teamName}</span>
            {gp.cscTier && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                {gp.cscTier}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-2xl font-extrabold leading-none ${scoreColor(score)}`}>
            {Math.round(score)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
            fit
          </div>
        </div>
      </div>

      {/* Match strength bar */}
      <div className="h-1 rounded-full bg-dark-600 overflow-hidden mb-3">
        <div
          className={`h-full ${scoreBg(score)} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Highlight stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {arch.highlightStats.map((hs) => {
          const v = Number(stats[hs.key]);
          // Apply tinting using statRanges where available, otherwise neutral.
          const range =
            (statRanges as unknown as Record<string, { good: number; average: number; inverted?: boolean } | undefined>)[
              hs.key as string
            ];
          const colorClass = range ? getStatColor(v, range) : 'text-slate-200';
          return (
            <div key={hs.key as string} className="bg-dark-700/50 rounded-lg p-2 border border-white/5">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
                {hs.label}
              </div>
              <div className={`text-sm font-bold tabular-nums ${colorClass}`}>
                {hs.format(v)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary archetype */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {secondaryArch ? (
            <>
              <span className="text-slate-500">Also:</span>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${secondaryArch.borderClass} ${secondaryArch.bgClass} ${secondaryArch.textClass} truncate`}
              >
                <secondaryArch.icon size={11} />
                <span className="truncate">{secondaryArch.name}</span>
              </span>
            </>
          ) : (
            <span className="text-slate-600 italic">Pure {arch.role.split(' / ')[0]}</span>
          )}
        </div>
        <span className="text-slate-500 tabular-nums flex-shrink-0">
          {stats.games}g · {stats.roundsPlayed}rd
        </span>
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Archetype overview chip (top of page, scrolls to section on click)
// -----------------------------------------------------------------------------

function ArchetypeChip({
  arch,
  count,
  onClick,
}: {
  arch: Archetype;
  count: number;
  onClick: () => void;
}) {
  const Icon = arch.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass rounded-xl p-4 card-glow text-left border ${arch.borderClass} hover:scale-[1.02] transition-all cursor-pointer flex flex-col gap-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${arch.gradientClass} border ${arch.borderClass}`}>
          <Icon size={20} className={arch.textClass} />
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${arch.textClass} leading-none`}>{count}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
            player{count === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      <div>
        <div className={`text-sm font-bold ${arch.textClass}`}>{arch.name}</div>
        <div className="text-xs text-slate-500">{arch.role}</div>
      </div>
      <div className="text-[11px] text-slate-400 italic line-clamp-1">"{arch.tagline}"</div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Archetype section (full description + player grid)
// -----------------------------------------------------------------------------

function ArchetypeSection({
  arch,
  players,
  onSelect,
}: {
  arch: Archetype;
  players: PlayerInGroup[];
  onSelect: (entry: PlayerInGroup) => void;
}) {
  const Icon = arch.icon;

  return (
    <section
      id={`archetype-${arch.id}`}
      className={`glass rounded-2xl p-5 sm:p-6 card-glow border ${arch.borderClass} scroll-mt-24`}
    >
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${arch.gradientClass} border ${arch.borderClass} flex-shrink-0`}
        >
          <Icon size={32} className={arch.textClass} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-2xl font-extrabold ${arch.textClass}`}>{arch.name}</h2>
            <span className="text-sm text-slate-400">{arch.role}</span>
          </div>
          <div className={`text-sm italic ${arch.textClass} opacity-80 mt-1`}>"{arch.tagline}"</div>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-3xl">
            {arch.description}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Defining stats:
            </span>
            {arch.stats.map((s) => (
              <span
                key={s.key as string}
                className={`text-[10px] px-2 py-0.5 rounded-md ${arch.bgClass} ${arch.textClass} border ${arch.borderClass}`}
              >
                {s.inverted ? 'low ' : ''}
                {String(s.key)
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (c) => c.toUpperCase())
                  .trim()}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className={`text-4xl font-extrabold ${arch.textClass}`}>{players.length}</div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            player{players.length === 1 ? '' : 's'}
          </div>
        </div>
      </header>

      {players.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-6 italic">
          No players match this archetype with current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {players.map((p) => (
            <PlayerCard key={p.gp.steamId} entry={p} arch={arch} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Archetypes({ players }: Props) {
  const [mode, setMode] = useState<StatMode>('regulation');
  const [tier, setTier] = useState<string>('All');
  const [minGames, setMinGames] = useState<number>(3);
  const [sort, setSort] = useState<'skill' | 'name'>('skill');
  const [selected, setSelected] = useState<{ entry: PlayerInGroup; arch: Archetype } | null>(null);

  // Build {gp, stats} pool that respects mode + filters.
  const pool = useMemo(() => {
    const list: { gp: GroupedPlayer; stats: PlayerStats }[] = [];
    for (const gp of players) {
      const stats = getBestEntry(gp, mode);
      if (!stats) continue;
      if (stats.games < minGames) continue;
      if (tier !== 'All') {
        if ((gp.cscTier ?? '').toLowerCase() !== tier.toLowerCase()) continue;
      }
      list.push({ gp, stats });
    }
    return list;
  }, [players, mode, tier, minGames]);

  const tiers = useMemo(() => {
    const set = new Set<string>();
    for (const gp of players) {
      if (gp.cscTier) set.add(gp.cscTier);
    }
    const arr = Array.from(set);
    arr.sort((a, b) => tierRank(a) - tierRank(b));
    return ['All', ...arr];
  }, [players]);

  const assignments = useMemo(() => assignArchetypes(pool), [pool]);
  const skillRatings = useMemo(() => computeSkillRatings(pool), [pool]);

  const grouped = useMemo(() => {
    const groups = new Map<string, PlayerInGroup[]>();
    for (const arch of ARCHETYPES) groups.set(arch.id, []);
    for (const { gp, stats } of pool) {
      const a = assignments.get(gp.steamId);
      if (!a) continue;
      const list = groups.get(a.primary.archetypeId);
      if (!list) continue;
      list.push({
        gp,
        stats,
        score: a.primary.score,
        secondary: a.secondary
          ? { id: a.secondary.archetypeId, score: a.secondary.score }
          : null,
      });
    }
    for (const list of groups.values()) {
      if (sort === 'skill') {
        list.sort((a, b) => {
          const sa = skillRatings.get(a.gp.steamId)?.skillRating ?? 0;
          const sb = skillRatings.get(b.gp.steamId)?.skillRating ?? 0;
          return sb - sa;
        });
      } else {
        list.sort((a, b) => a.gp.name.toLowerCase().localeCompare(b.gp.name.toLowerCase()));
      }
    }
    return groups;
  }, [pool, assignments, sort, skillRatings]);

  function jumpTo(id: string) {
    const el = document.getElementById(`archetype-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="p-2 rounded-xl bg-gradient-to-br from-neon-purple/25 to-neon-blue/25 border border-neon-purple/30">
            <Sparkles size={28} className="text-neon-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold gradient-text">Player Archetypes</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Every player gets dropped into a build — like NBA 2K, but for CS2.
              Each archetype is scored from the percentile of role-defining stats inside the
              currently filtered pool. Primary archetype is the best fit; the badge under each
              card shows their secondary specialty.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <ModeToggle mode={mode} onChange={(m) => { setTier('All'); setMode(m); }} />

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="appearance-none glass rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer min-w-[160px]"
            >
              {tiers.map((t) => (
                <option key={t} value={t} className="bg-dark-800 text-slate-200">
                    {t === 'All' ? 'All Tiers' : t}
                </option>
              ))}
            </select>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'skill' | 'name')}
            className="appearance-none glass rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer"
          >
            <option value="skill" className="bg-dark-800 text-slate-200">Sort: Skill Rating</option>
            <option value="name" className="bg-dark-800 text-slate-200">Sort: Name</option>
          </select>

          <select
            value={minGames}
            onChange={(e) => setMinGames(Number(e.target.value))}
            className="appearance-none glass rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer"
          >
            {MIN_GAMES_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-dark-800 text-slate-200">
                Min {n} game{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-slate-400 ml-auto">
            <Users size={16} />
            {pool.length} player{pool.length === 1 ? '' : 's'} classified
          </div>
        </div>
      </div>

      {/* Archetype overview (jump-to chips) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {ARCHETYPES.map((arch) => (
          <ArchetypeChip
            key={arch.id}
            arch={arch}
            count={grouped.get(arch.id)?.length ?? 0}
            onClick={() => jumpTo(arch.id)}
          />
        ))}
      </div>

      {/* Per-archetype sections */}
      <div className="space-y-5">
        {ARCHETYPES.map((arch) => (
          <ArchetypeSection
            key={arch.id}
            arch={arch}
            players={grouped.get(arch.id) ?? []}
            onSelect={(entry) => setSelected({ entry, arch })}
          />
        ))}
      </div>

      {pool.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-slate-300">No players match the current filters.</p>
          <p className="text-slate-500 text-sm mt-2">
            Try lowering the minimum games or selecting a different tier.
          </p>
        </div>
      )}

      {selected && (
        <PlayerArchetypeModal
          gp={selected.entry.gp}
          stats={selected.entry.stats}
          arch={selected.arch}
          score={selected.entry.score}
          secondary={selected.entry.secondary}
          pool={pool}
          skill={skillRatings.get(selected.entry.gp.steamId) ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
