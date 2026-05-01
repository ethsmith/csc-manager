import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import type { GroupedPlayer, PlayerStats } from '../types';
import { fetchFranchises, type Franchise, getPlayerTypeLabel, getPlayerTypeColor, type PlayerType } from '../fetchFranchises';
import { statRanges, getStatColor } from '../statRanges';

interface Props {
  players: GroupedPlayer[];
}

type SortKey = 'finalRating' | 'hltvRating' | 'adr' | 'kpr' | 'kast' | 'kdRatio' | 'games' | 'roundsPlayed';
type SortDir = 'asc' | 'desc';

function kdRatio(k: number, d: number): number {
  return d === 0 ? k : +(k / d).toFixed(3);
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function getStats(gp: GroupedPlayer): PlayerStats | null {
  return gp.regulation ?? gp.combine;
}

export default function Drafting({ players }: Props) {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [draftList, setDraftList] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('finalRating');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedTypes, setSelectedTypes] = useState<Set<PlayerType>>(new Set());

  useEffect(() => {
    fetchFranchises()
      .then((data) => setFranchises(data ?? []))
      .catch(() => setFranchises([]))
      .finally(() => setLoading(false));
  }, []);

  const franchise = useMemo(
    () => franchises.find((f) => f.name === selectedFranchise) ?? null,
    [franchises, selectedFranchise]
  );

  const team = useMemo(
    () => franchise?.teams.find((t) => t.id === selectedTeamId) ?? null,
    [franchise, selectedTeamId]
  );

  const tier = team?.tier?.name ?? null;

  const availablePlayers = useMemo(() => {
    if (!tier) return [];
    const result: GroupedPlayer[] = [];
    const draftSet = new Set(draftList);

    for (const gp of players) {
      if (gp.cscTier !== tier) continue;
      if (draftSet.has(gp.steamId)) continue;
      const stats = getStats(gp);
      if (!stats || stats.games === 0) continue;
      result.push(gp);
    }
    return result;
  }, [players, tier, draftList]);

  const availableTypes = useMemo(() => {
    const types = new Set<PlayerType>();
    for (const gp of availablePlayers) {
      if (gp.cscPlayerType) {
        types.add(gp.cscPlayerType as PlayerType);
      }
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

  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const sa = getStats(a)!;
      const sb = getStats(b)!;
      let va: number;
      let vb: number;
      switch (sortKey) {
        case 'kdRatio':
          va = kdRatio(sa.kills, sa.deaths);
          vb = kdRatio(sb.kills, sb.deaths);
          break;
        case 'finalRating':
          va = sa.finalRating;
          vb = sb.finalRating;
          break;
        case 'hltvRating':
          va = sa.hltvRating;
          vb = sb.hltvRating;
          break;
        case 'adr':
          va = sa.adr;
          vb = sb.adr;
          break;
        case 'kpr':
          va = sa.kpr;
          vb = sb.kpr;
          break;
        case 'kast':
          va = sa.kast;
          vb = sb.kast;
          break;
        case 'games':
          va = sa.games;
          vb = sb.games;
          break;
        case 'roundsPlayed':
          va = sa.roundsPlayed;
          vb = sb.roundsPlayed;
          break;
        default:
          va = sa.finalRating;
          vb = sb.finalRating;
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [filteredPlayers, sortKey, sortDir]);

  const draftPlayers = useMemo(() => {
    const draftSet = new Set(draftList);
    const result: GroupedPlayer[] = [];
    for (const gp of players) {
      if (draftSet.has(gp.steamId)) {
        result.push(gp);
      }
    }
    return result.sort((a, b) => {
      const sa = getStats(a)?.finalRating ?? 0;
      const sb = getStats(b)?.finalRating ?? 0;
      return sb - sa;
    });
  }, [players, draftList]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />;
  };

  const addToDraft = (steamId: string) => {
    setDraftList((prev) => [...prev, steamId]);
  };

  const removeFromDraft = (steamId: string) => {
    setDraftList((prev) => prev.filter((id) => id !== steamId));
  };

  const clearDraft = () => setDraftList([]);

  const toggleType = (type: PlayerType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      if (next.size === availableTypes.length) return new Set();
      return next;
    });
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Available Players ──────────────────── */}
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
                      <th className="text-left px-4 py-3 font-medium uppercase tracking-wider">Player</th>
                      <th className="text-left px-3 py-3 font-medium uppercase tracking-wider">Type</th>
                      <th className="text-right px-3 py-3 font-medium uppercase tracking-wider cursor-pointer hover:text-slate-200" onClick={() => handleSort('games')}>
                        <span className="inline-flex items-center gap-1">G{sortIcon('games')}</span>
                      </th>
                      <th className="text-right px-3 py-3 font-medium uppercase tracking-wider cursor-pointer hover:text-slate-200" onClick={() => handleSort('finalRating')}>
                        <span className="inline-flex items-center gap-1">Rating{sortIcon('finalRating')}</span>
                      </th>
                      <th className="text-right px-3 py-3 font-medium uppercase tracking-wider cursor-pointer hover:text-slate-200" onClick={() => handleSort('hltvRating')}>
                        <span className="inline-flex items-center gap-1">HLTV{sortIcon('hltvRating')}</span>
                      </th>
                      <th className="text-right px-3 py-3 font-medium uppercase tracking-wider cursor-pointer hover:text-slate-200" onClick={() => handleSort('kdRatio')}>
                        <span className="inline-flex items-center gap-1">K/D{sortIcon('kdRatio')}</span>
                      </th>
                      <th className="text-right px-3 py-3 font-medium uppercase tracking-wider cursor-pointer hover:text-slate-200" onClick={() => handleSort('adr')}>
                        <span className="inline-flex items-center gap-1">ADR{sortIcon('adr')}</span>
                      </th>
                      <th className="text-right px-3 py-3 font-medium uppercase tracking-wider cursor-pointer hover:text-slate-200" onClick={() => handleSort('kast')}>
                        <span className="inline-flex items-center gap-1">KAST{sortIcon('kast')}</span>
                      </th>
                      <th className="text-center px-2 py-3 font-medium uppercase tracking-wider">Draft</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((gp) => {
                      const s = getStats(gp)!;
                      const kd = kdRatio(s.kills, s.deaths);
                      return (
                        <tr
                          key={gp.steamId}
                          className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <a
                              href={`/players/${gp.steamId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-slate-200 hover:text-accent transition-colors"
                            >
                              {gp.name}
                              <ExternalLink size={12} className="opacity-40" />
                            </a>
                          </td>
                          <td className="px-3 py-2.5">
                            {gp.cscPlayerType ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getPlayerTypeColor(gp.cscPlayerType as PlayerType)}`}>
                                {getPlayerTypeLabel(gp.cscPlayerType as PlayerType)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-400">{s.games}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${getStatColor(s.finalRating, statRanges.hltvRating)}`}>
                            {s.finalRating.toFixed(3)}
                          </td>
                          <td className={`px-3 py-2.5 text-right ${getStatColor(s.hltvRating, statRanges.hltvRating)}`}>
                            {s.hltvRating.toFixed(3)}
                          </td>
                          <td className={`px-3 py-2.5 text-right ${getStatColor(kd, statRanges.kdRatio)}`}>
                            {kd.toFixed(2)}
                          </td>
                          <td className={`px-3 py-2.5 text-right ${getStatColor(s.adr, statRanges.adr)}`}>
                            {s.adr.toFixed(1)}
                          </td>
                          <td className={`px-3 py-2.5 text-right ${getStatColor(s.kast, statRanges.kast)}`}>
                            {pct(s.kast)}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <button
                              onClick={() => addToDraft(gp.steamId)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer"
                            >
                              <Plus size={12} />
                              Add
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {sortedPlayers.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                          {availablePlayers.length === 0
                            ? `No players found in tier "${tier}" with regulation stats`
                            : 'No players match your search'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Draft List ──────────────────────────── */}
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
                <div className="divide-y divide-white/[0.03] max-h-[600px] overflow-y-auto">
                  {draftPlayers.map((gp, idx) => {
                    const s = getStats(gp);
                    const kd = s ? kdRatio(s.kills, s.deaths) : 0;
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
                        {gp.cscPlayerType && (
                          <div className="mb-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${getPlayerTypeColor(gp.cscPlayerType as PlayerType)}`}>
                              {getPlayerTypeLabel(gp.cscPlayerType as PlayerType)}
                            </span>
                          </div>
                        )}
                        {s ? (
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
                              <span className={`ml-1 ${getStatColor(kd, statRanges.kdRatio)}`}>
                                {kd.toFixed(2)}
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
                                {pct(s.kast)}
                              </span>
                            </div>
                            <div className="text-xs">
                              <span className="text-slate-500">Gms</span>
                              <span className="ml-1 text-slate-400">{s.games}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No regulation stats</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {draftPlayers.length > 0 && (
                <div className="px-5 py-3 border-t border-white/5 bg-accent/[0.02]">
                  <div className="text-xs text-slate-400">
                    Best avg rating:{' '}
                    <span className="text-accent font-semibold">
                      {(() => {
                        const ratings = draftPlayers
                          .filter((p) => getStats(p) != null)
                          .map((p) => getStats(p)!.finalRating);
                        if (ratings.length === 0) return '—';
                        return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(3);
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
