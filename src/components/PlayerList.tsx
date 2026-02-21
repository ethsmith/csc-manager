import { useState, useMemo, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, Users, Trophy, Filter, Plus, X, SlidersHorizontal } from 'lucide-react';
import type { GroupedPlayer, StatMode, PlayerStats } from '../types';
import ModeToggle from './ModeToggle';

interface Props {
  players: GroupedPlayer[];
  mode: StatMode;
  onModeChange: (mode: StatMode) => void;
  onSelect: (player: GroupedPlayer) => void;
}

type SortKey = keyof PlayerStats;
type SortDir = 'asc' | 'desc';
type NumOp = '<' | '>' | '>=' | '<=' | '=';
type StrOp = 'equals' | 'contains';

interface StatFilter {
  id: number;
  field: keyof PlayerStats;
  op: NumOp | StrOp;
  value: string;
}

interface StatFieldDef {
  key: keyof PlayerStats;
  label: string;
  type: 'number' | 'string';
  group: string;
}

const STAT_FIELDS: StatFieldDef[] = [
  // Identity
  { key: 'name', label: 'Name', type: 'string', group: 'Identity' },
  { key: 'tier', label: 'Tier', type: 'string', group: 'Identity' },
  { key: 'steamId', label: 'Steam ID', type: 'string', group: 'Identity' },
  // Core
  { key: 'games', label: 'Games', type: 'number', group: 'Core' },
  { key: 'finalRating', label: 'Final Rating', type: 'number', group: 'Core' },
  { key: 'hltvRating', label: 'HLTV Rating', type: 'number', group: 'Core' },
  { key: 'roundsPlayed', label: 'Rounds Played', type: 'number', group: 'Core' },
  { key: 'roundsWon', label: 'Rounds Won', type: 'number', group: 'Core' },
  { key: 'roundsLost', label: 'Rounds Lost', type: 'number', group: 'Core' },
  // Combat
  { key: 'kills', label: 'Kills', type: 'number', group: 'Combat' },
  { key: 'assists', label: 'Assists', type: 'number', group: 'Combat' },
  { key: 'deaths', label: 'Deaths', type: 'number', group: 'Combat' },
  { key: 'damage', label: 'Damage', type: 'number', group: 'Combat' },
  { key: 'adr', label: 'ADR', type: 'number', group: 'Combat' },
  { key: 'kpr', label: 'KPR', type: 'number', group: 'Combat' },
  { key: 'dpr', label: 'DPR', type: 'number', group: 'Combat' },
  { key: 'kast', label: 'KAST', type: 'number', group: 'Combat' },
  { key: 'survival', label: 'Survival', type: 'number', group: 'Combat' },
  { key: 'headshots', label: 'Headshots', type: 'number', group: 'Combat' },
  { key: 'headshotPct', label: 'Headshot %', type: 'number', group: 'Combat' },
  { key: 'avgTimeToKill', label: 'Avg TTK', type: 'number', group: 'Combat' },
  { key: 'damagePerKill', label: 'Damage/Kill', type: 'number', group: 'Combat' },
  // Opening Duels
  { key: 'openingKills', label: 'Opening Kills', type: 'number', group: 'Opening' },
  { key: 'openingDeaths', label: 'Opening Deaths', type: 'number', group: 'Opening' },
  { key: 'openingAttempts', label: 'Opening Attempts', type: 'number', group: 'Opening' },
  { key: 'openingSuccessPct', label: 'Opening Success %', type: 'number', group: 'Opening' },
  { key: 'openingKillsPerRound', label: 'Opening Kills/Rd', type: 'number', group: 'Opening' },
  { key: 'openingDeathsPerRound', label: 'Opening Deaths/Rd', type: 'number', group: 'Opening' },
  { key: 'winPctAfterOpeningKill', label: 'Win % After Entry', type: 'number', group: 'Opening' },
  // Economy
  { key: 'ecoKillValue', label: 'Eco Kill Value', type: 'number', group: 'Economy' },
  { key: 'ecoDeathValue', label: 'Eco Death Value', type: 'number', group: 'Economy' },
  { key: 'econImpact', label: 'Econ Impact', type: 'number', group: 'Economy' },
  { key: 'roundImpact', label: 'Round Impact', type: 'number', group: 'Economy' },
  // Clutch & Trades
  { key: 'clutchRounds', label: 'Clutch Rounds', type: 'number', group: 'Clutch' },
  { key: 'clutchWins', label: 'Clutch Wins', type: 'number', group: 'Clutch' },
  { key: 'clutch1v1Attempts', label: '1v1 Attempts', type: 'number', group: 'Clutch' },
  { key: 'clutch1v1Wins', label: '1v1 Wins', type: 'number', group: 'Clutch' },
  { key: 'clutch1v1WinPct', label: '1v1 Win %', type: 'number', group: 'Clutch' },
  { key: 'tradeKills', label: 'Trade Kills', type: 'number', group: 'Clutch' },
  { key: 'tradeKillsPerRound', label: 'Trade Kills/Rd', type: 'number', group: 'Clutch' },
  { key: 'tradedDeaths', label: 'Traded Deaths', type: 'number', group: 'Clutch' },
  { key: 'tradedDeathsPct', label: 'Traded Deaths %', type: 'number', group: 'Clutch' },
  // Multi-kills
  { key: 'oneK', label: '1K Rounds', type: 'number', group: 'Multi-Kill' },
  { key: 'twoK', label: '2K Rounds', type: 'number', group: 'Multi-Kill' },
  { key: 'threeK', label: '3K Rounds', type: 'number', group: 'Multi-Kill' },
  { key: 'fourK', label: '4K Rounds', type: 'number', group: 'Multi-Kill' },
  { key: 'fiveK', label: '5K Rounds', type: 'number', group: 'Multi-Kill' },
  { key: 'roundsWithKillPct', label: 'Rounds w/ Kill %', type: 'number', group: 'Multi-Kill' },
  { key: 'roundsWithMultiKillPct', label: 'Rounds w/ Multi-Kill %', type: 'number', group: 'Multi-Kill' },
  // AWP
  { key: 'awpKills', label: 'AWP Kills', type: 'number', group: 'AWP' },
  { key: 'awpKillsPerRound', label: 'AWP Kills/Rd', type: 'number', group: 'AWP' },
  { key: 'awpOpeningKills', label: 'AWP Opening Kills', type: 'number', group: 'AWP' },
  { key: 'awpMultiKillRounds', label: 'AWP Multi-Kill Rds', type: 'number', group: 'AWP' },
  // Utility
  { key: 'utilityDamage', label: 'Util Damage', type: 'number', group: 'Utility' },
  { key: 'utilityDamagePerRound', label: 'Util Damage/Rd', type: 'number', group: 'Utility' },
  { key: 'utilityKills', label: 'Util Kills', type: 'number', group: 'Utility' },
  { key: 'flashesThrown', label: 'Flashes Thrown', type: 'number', group: 'Utility' },
  { key: 'flashAssists', label: 'Flash Assists', type: 'number', group: 'Utility' },
  { key: 'enemyFlashDurationPerRound', label: 'Enemy Flash/Rd', type: 'number', group: 'Utility' },
  // Sides
  { key: 'tRating', label: 'T Rating', type: 'number', group: 'Sides' },
  { key: 'tKills', label: 'T Kills', type: 'number', group: 'Sides' },
  { key: 'tDeaths', label: 'T Deaths', type: 'number', group: 'Sides' },
  { key: 'tKast', label: 'T KAST', type: 'number', group: 'Sides' },
  { key: 'ctRating', label: 'CT Rating', type: 'number', group: 'Sides' },
  { key: 'ctKills', label: 'CT Kills', type: 'number', group: 'Sides' },
  { key: 'ctDeaths', label: 'CT Deaths', type: 'number', group: 'Sides' },
  { key: 'ctKast', label: 'CT KAST', type: 'number', group: 'Sides' },
  // Pistol
  { key: 'pistolRoundsPlayed', label: 'Pistol Rounds', type: 'number', group: 'Pistol' },
  { key: 'pistolRoundKills', label: 'Pistol Kills', type: 'number', group: 'Pistol' },
  { key: 'pistolRoundRating', label: 'Pistol Rating', type: 'number', group: 'Pistol' },
  // Maps
  { key: 'ancientRating', label: 'Ancient Rating', type: 'number', group: 'Maps' },
  { key: 'ancientGames', label: 'Ancient Games', type: 'number', group: 'Maps' },
  { key: 'anubisRating', label: 'Anubis Rating', type: 'number', group: 'Maps' },
  { key: 'anubisGames', label: 'Anubis Games', type: 'number', group: 'Maps' },
  { key: 'dust2Rating', label: 'Dust2 Rating', type: 'number', group: 'Maps' },
  { key: 'dust2Games', label: 'Dust2 Games', type: 'number', group: 'Maps' },
  { key: 'infernoRating', label: 'Inferno Rating', type: 'number', group: 'Maps' },
  { key: 'infernoGames', label: 'Inferno Games', type: 'number', group: 'Maps' },
  { key: 'mirageRating', label: 'Mirage Rating', type: 'number', group: 'Maps' },
  { key: 'mirageGames', label: 'Mirage Games', type: 'number', group: 'Maps' },
  { key: 'nukeRating', label: 'Nuke Rating', type: 'number', group: 'Maps' },
  { key: 'nukeGames', label: 'Nuke Games', type: 'number', group: 'Maps' },
  { key: 'overpassRating', label: 'Overpass Rating', type: 'number', group: 'Maps' },
  { key: 'overpassGames', label: 'Overpass Games', type: 'number', group: 'Maps' },
];

const NUM_OPS: { value: NumOp; label: string }[] = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '=', label: '=' },
];

const STR_OPS: { value: StrOp; label: string }[] = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
];

const FIELD_MAP = new Map(STAT_FIELDS.map((f) => [f.key, f]));

const TABLE_COLUMNS: { key: keyof PlayerStats | 'playerName'; label: string; sortable: boolean }[] = [
  { key: 'playerName', label: 'Player', sortable: true },
  { key: 'tier', label: 'Tier', sortable: true },
  { key: 'games', label: 'Games', sortable: true },
  { key: 'finalRating', label: 'Rating', sortable: true },
  { key: 'kills', label: 'Kills', sortable: true },
  { key: 'adr', label: 'ADR', sortable: true },
  { key: 'kast', label: 'KAST', sortable: true },
];

function ratingColor(rating: number): string {
  if (rating >= 1.2) return 'text-emerald-400';
  if (rating >= 1.0) return 'text-neon-blue';
  if (rating >= 0.8) return 'text-yellow-400';
  return 'text-red-400';
}

function getBestEntry(gp: GroupedPlayer, mode: StatMode): PlayerStats | null {
  const entries = mode === 'regulation' ? gp.regulation : gp.scrim;
  if (entries.length === 0) return null;
  return entries.reduce((best, cur) =>
    cur.stats.finalRating > best.stats.finalRating ? cur : best
  ).stats;
}

function getTiers(gp: GroupedPlayer, mode: StatMode): string[] {
  const entries = mode === 'regulation' ? gp.regulation : gp.scrim;
  return [...new Set(entries.map((e) => e.tier))];
}

function applyNumOp(val: number, op: NumOp, target: number): boolean {
  switch (op) {
    case '<': return val < target;
    case '>': return val > target;
    case '>=': return val >= target;
    case '<=': return val <= target;
    case '=': return val === target;
  }
}

function applyStrOp(val: string, op: StrOp, target: string): boolean {
  const v = val.toLowerCase();
  const t = target.toLowerCase();
  switch (op) {
    case 'equals': return v === t;
    case 'contains': return v.includes(t);
  }
}

function applyFilter(stats: PlayerStats, filter: StatFilter): boolean {
  const def = FIELD_MAP.get(filter.field);
  if (!def || !filter.value.trim()) return true;

  if (def.type === 'number') {
    const target = parseFloat(filter.value);
    if (isNaN(target)) return true;
    const val = stats[filter.field] as number;
    return applyNumOp(val, filter.op as NumOp, target);
  } else {
    const val = String(stats[filter.field]);
    return applyStrOp(val, filter.op as StrOp, filter.value);
  }
}

let nextFilterId = 1;

export default function PlayerList({ players, mode, onModeChange, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('finalRating');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [filters, setFilters] = useState<StatFilter[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const addFilter = useCallback(() => {
    setFilters((prev) => [
      ...prev,
      { id: nextFilterId++, field: 'finalRating', op: '>', value: '' },
    ]);
    setFiltersOpen(true);
  }, []);

  const removeFilter = useCallback((id: number) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFilter = useCallback((id: number, patch: Partial<StatFilter>) => {
    setFilters((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, ...patch };
        // Reset op when switching between number/string field types
        if (patch.field) {
          const newDef = FIELD_MAP.get(patch.field);
          const oldDef = FIELD_MAP.get(f.field);
          if (newDef && oldDef && newDef.type !== oldDef.type) {
            updated.op = newDef.type === 'number' ? '>' : 'contains';
            updated.value = '';
          }
        }
        return updated;
      })
    );
  }, []);

  const playersWithStats = useMemo(() => {
    return players
      .map((gp) => ({ gp, stats: getBestEntry(gp, mode) }))
      .filter((x): x is { gp: GroupedPlayer; stats: PlayerStats } => x.stats !== null);
  }, [players, mode]);

  const tiers = useMemo(() => {
    const set = new Set<string>();
    playersWithStats.forEach(({ gp }) => {
      getTiers(gp, mode).forEach((t) => set.add(t));
    });
    return ['all', ...Array.from(set).sort()];
  }, [playersWithStats, mode]);

  const filtered = useMemo(() => {
    let result = [...playersWithStats];

    if (tierFilter !== 'all') {
      result = result.filter(({ gp }) =>
        getTiers(gp, mode).includes(tierFilter)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        ({ gp, stats }) =>
          gp.name.toLowerCase().includes(q) ||
          stats.name.toLowerCase().includes(q) ||
          stats.tier.toLowerCase().includes(q) ||
          gp.steamId.includes(q)
      );
    }

    // Apply stat filters
    for (const filter of filters) {
      if (!filter.value.trim()) continue;
      result = result.filter(({ stats }) => applyFilter(stats, filter));
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.gp.name.localeCompare(b.gp.name);
      } else if (sortKey === 'tier') {
        cmp = (a.stats.tier as string).localeCompare(b.stats.tier as string);
      } else {
        cmp = (a.stats[sortKey] as number) - (b.stats[sortKey] as number);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [playersWithStats, search, sortKey, sortDir, tierFilter, mode, filters]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-slate-600 ml-1">⇅</span>;
    return sortDir === 'desc' ? (
      <ChevronDown size={14} className="inline ml-1 text-neon-blue" />
    ) : (
      <ChevronUp size={14} className="inline ml-1 text-neon-blue" />
    );
  }

  // Group stat fields for the select dropdown
  const groupedFields = useMemo(() => {
    const groups: { group: string; fields: StatFieldDef[] }[] = [];
    const seen = new Set<string>();
    for (const f of STAT_FIELDS) {
      if (!seen.has(f.group)) {
        seen.add(f.group);
        groups.push({ group: f.group, fields: STAT_FIELDS.filter((sf) => sf.group === f.group) });
      }
    }
    return groups;
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30">
            <Trophy size={28} className="text-neon-blue" />
          </div>
          <span className="gradient-text">FRAGG 3.0 Stats</span>
        </h1>
        <div className="flex items-center gap-3 ml-auto">
          <ModeToggle mode={mode} onChange={(m) => { setTierFilter('all'); onModeChange(m); }} />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users size={16} />
            {filtered.length} player{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search players by name, tier, or Steam ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl glass text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 transition-all neon-border-hover"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="glass rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 cursor-pointer neon-border-hover appearance-none min-w-[160px]"
        >
          {tiers.map((t) => (
            <option key={t} value={t} className="bg-dark-800">
              {t === 'all' ? '🏆 All Tiers' : t}
            </option>
          ))}
        </select>
        <button
          onClick={() => filters.length > 0 ? setFiltersOpen((o) => !o) : addFilter()}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl glass text-sm font-medium transition-all cursor-pointer neon-border-hover ${
            filters.length > 0
              ? 'text-neon-blue border-neon-blue/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {filters.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue text-xs font-bold">
              {filters.length}
            </span>
          )}
        </button>
      </div>

      {/* Stat Filters Panel */}
      {filtersOpen && (
        <div className="glass rounded-xl p-4 card-glow space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neon-blue flex items-center gap-2">
              <Filter size={14} />
              Stat Filters
            </h3>
            <div className="flex items-center gap-2">
              {filters.length > 0 && (
                <button
                  onClick={() => setFilters([])}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={addFilter}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20 transition-all cursor-pointer"
              >
                <Plus size={12} />
                Add filter
              </button>
            </div>
          </div>

          {filters.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-2">
              No filters added. Click "Add filter" to get started.
            </p>
          )}

          {filters.map((filter) => {
            const def = FIELD_MAP.get(filter.field);
            const isNum = def?.type === 'number';
            return (
              <div key={filter.id} className="flex items-center gap-2 flex-wrap">
                {/* Field selector */}
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(filter.id, { field: e.target.value as keyof PlayerStats })}
                  className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 cursor-pointer min-w-[180px]"
                >
                  {groupedFields.map(({ group, fields }) => (
                    <optgroup key={group} label={group}>
                      {fields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {/* Operator selector */}
                <select
                  value={filter.op}
                  onChange={(e) => updateFilter(filter.id, { op: e.target.value as NumOp | StrOp })}
                  className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 cursor-pointer min-w-[90px]"
                >
                  {(isNum ? NUM_OPS : STR_OPS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {/* Value input */}
                <input
                  type={isNum ? 'number' : 'text'}
                  step={isNum ? 'any' : undefined}
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  placeholder={isNum ? '0' : 'value...'}
                  className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 flex-1 min-w-[100px]"
                />

                {/* Remove button */}
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Sort by selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Sort by</span>
        <select
          value={sortKey}
          onChange={(e) => { setSortKey(e.target.value as SortKey); }}
          className="bg-dark-700 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 cursor-pointer"
        >
          {groupedFields.map(({ group, fields }) => (
            <optgroup key={group} label={group}>
              {fields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-dark-700 border border-white/10 text-slate-300 hover:text-neon-blue transition-colors cursor-pointer"
        >
          {sortDir === 'desc' ? (
            <><ChevronDown size={12} /> Desc</>
          ) : (
            <><ChevronUp size={12} /> Asc</>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden card-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-blue/10">
                {TABLE_COLUMNS.map(({ key, label }) => {
                  const actualSortKey: SortKey = key === 'playerName' ? 'name' : key as SortKey;
                  return (
                    <th
                      key={key}
                      onClick={() => toggleSort(actualSortKey)}
                      className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400 cursor-pointer hover:text-neon-blue transition-colors select-none whitespace-nowrap"
                    >
                      {key === 'tier' && mode === 'scrim' ? 'Scrim Team' : label}
                      <SortIcon col={actualSortKey} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ gp, stats }, i) => (
                <tr
                  key={gp.steamId}
                  onClick={() => onSelect(gp)}
                  className={`border-b border-white/5 cursor-pointer table-row-hover ${
                    i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 flex items-center justify-center text-sm font-bold text-neon-blue border border-neon-blue/30 shadow-lg shadow-neon-blue/10 avatar-ring">
                        {gp.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold">{gp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap font-medium ${
                      mode === 'scrim'
                        ? 'bg-neon-purple/15 text-neon-purple border-neon-purple/30'
                        : 'bg-neon-blue/15 text-neon-blue border-neon-blue/30'
                    }`}>
                      {stats.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{stats.games}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-lg ${ratingColor(stats.finalRating)}`}>
                      {stats.finalRating.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{stats.kills}</td>
                  <td className="px-4 py-3 text-slate-300">{stats.adr.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-300">{(stats.kast * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    {search || filters.length > 0
                      ? 'No players match the current filters'
                      : `No ${mode} stats available`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
