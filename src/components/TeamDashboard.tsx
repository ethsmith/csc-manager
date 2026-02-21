import { useState, useMemo, useEffect } from 'react';
import { Building2, Users, Trophy, ChevronDown, Star, TrendingUp, Target, Shield, Loader2, Crown } from 'lucide-react';
import type { GroupedPlayer, StatMode, PlayerStats } from '../types';
import { fetchFranchises, fetchAllPlayers, getPlayerTypeLabel, getPlayerTypeColor, type Franchise, type CscPlayer, type FranchiseTeam } from '../fetchFranchises';
import ModeToggle from './ModeToggle';

interface Props {
  players: GroupedPlayer[];
}

function ratingColor(rating: number): string {
  if (rating >= 1.2) return 'text-emerald-400';
  if (rating >= 1.0) return 'text-neon-blue';
  if (rating >= 0.8) return 'text-yellow-400';
  return 'text-red-400';
}

export default function TeamDashboard({ players }: Props) {
  const [mode, setMode] = useState<StatMode>('regulation');
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<FranchiseTeam | null>(null);
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [allCscPlayers, setAllCscPlayers] = useState<CscPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchFranchises(), fetchAllPlayers()])
      .then(([franchiseData, playerData]) => {
        setFranchises(franchiseData);
        setAllCscPlayers(playerData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const freeAgents = useMemo(() => {
    return allCscPlayers.filter((p) => 
      ['FREE_AGENT', 'DRAFT_ELIGIBLE', 'PERMANENT_FREE_AGENT'].includes(p.type)
    );
  }, [allCscPlayers]);

  const teamRosterWithStats = useMemo(() => {
    if (!selectedTeam) return [];

    return selectedTeam.players.map((fp) => {
      const cscPlayer = allCscPlayers.find((p) => p.steam64Id === fp.steam64Id);
      const groupedPlayer = players.find((gp) => gp.steamId === fp.steam64Id);
      
      let stats: PlayerStats | null = null;
      if (groupedPlayer) {
        const entries = mode === 'regulation' ? groupedPlayer.regulation : groupedPlayer.scrim;
        const entry = entries.find((e) => e.tier === selectedTeam.tier.name);
        stats = entry?.stats ?? (entries.length > 0 ? entries[0].stats : null);
      }

      return {
        franchisePlayer: fp,
        cscPlayer,
        groupedPlayer,
        stats,
        isCaptain: selectedTeam.captain?.steam64Id === fp.steam64Id,
      };
    }).sort((a, b) => {
      if (a.isCaptain) return -1;
      if (b.isCaptain) return 1;
      if (a.stats && b.stats) return b.stats.finalRating - a.stats.finalRating;
      if (a.stats) return -1;
      if (b.stats) return 1;
      return 0;
    });
  }, [selectedTeam, players, allCscPlayers, mode]);

  const teamStats = useMemo(() => {
    const playersWithStats = teamRosterWithStats.filter((p) => p.stats);
    if (playersWithStats.length === 0) return null;

    const totalGames = Math.max(...playersWithStats.map((p) => p.stats!.games));
    const avgRating = playersWithStats.reduce((sum, p) => sum + p.stats!.finalRating, 0) / playersWithStats.length;
    const avgAdr = playersWithStats.reduce((sum, p) => sum + p.stats!.adr, 0) / playersWithStats.length;
    const avgKast = playersWithStats.reduce((sum, p) => sum + p.stats!.kast, 0) / playersWithStats.length;
    const totalKills = playersWithStats.reduce((sum, p) => sum + p.stats!.kills, 0);
    const totalDeaths = playersWithStats.reduce((sum, p) => sum + p.stats!.deaths, 0);
    const totalMmr = teamRosterWithStats.reduce((sum, p) => sum + p.franchisePlayer.mmr, 0);

    return {
      playerCount: teamRosterWithStats.length,
      playersWithStats: playersWithStats.length,
      totalGames,
      avgRating,
      avgAdr,
      avgKast,
      totalKills,
      totalDeaths,
      kdRatio: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
      totalMmr,
      mmrCap: selectedTeam?.tier.mmrCap ?? 0,
    };
  }, [teamRosterWithStats, selectedTeam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 animate-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-neon-purple/20 blur-xl animate-pulse" />
            <Loader2 size={48} className="animate-spin text-neon-purple mx-auto relative" />
          </div>
          <p className="text-slate-300 text-lg font-medium">Loading franchise data...</p>
          <p className="text-slate-500 text-sm">Fetching from CSC API</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-8 card-glow max-w-md mx-auto text-center space-y-3">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-red-400">Failed to load franchise data</h2>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30">
            <Building2 size={28} className="text-neon-purple" />
          </div>
          <span className="gradient-text">Team Dashboard</span>
        </h1>
        <div className="ml-auto">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </div>

      {/* Franchise Selector */}
      <div className="glass rounded-xl p-6 card-glow relative z-30">
        <h2 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-gradient-to-b from-neon-blue to-neon-purple rounded-full"></span>
          Select Your Franchise
        </h2>
        
        <div className="relative">
          <button
            onClick={() => { setFranchiseDropdownOpen(!franchiseDropdownOpen); setTeamDropdownOpen(false); }}
            className="w-full max-w-lg flex items-center justify-between gap-3 px-4 py-3 rounded-xl glass text-left neon-border-hover cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Building2 size={20} className={selectedFranchise ? 'text-neon-purple' : 'text-slate-400'} />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Franchise</div>
                <span className={selectedFranchise ? 'text-slate-200' : 'text-slate-400'}>
                  {selectedFranchise ? `[${selectedFranchise.prefix}] ${selectedFranchise.name}` : 'Choose a franchise...'}
                </span>
              </div>
            </div>
            <ChevronDown size={20} className={`text-slate-400 transition-transform ${franchiseDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {franchiseDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-full max-w-lg rounded-xl shadow-2xl max-h-80 overflow-y-auto dropdown-menu z-50">
              {franchises.map((franchise) => (
                <button
                  key={franchise.name}
                  onClick={() => {
                    setSelectedFranchise(franchise);
                    setSelectedTeam(null);
                    setFranchiseDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                    selectedFranchise?.name === franchise.name
                      ? 'bg-neon-purple/15 text-neon-purple'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Building2 size={18} />
                  <div>
                    <span className="font-medium">[{franchise.prefix}]</span> {franchise.name}
                    <div className="text-xs text-slate-500">
                      GM: {franchise.gm?.name ?? 'N/A'} · {franchise.teams.length} team{franchise.teams.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Franchise Info */}
        {selectedFranchise && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-yellow-400" />
              <span className="text-slate-400">GM:</span>
              <span className="text-slate-200">{selectedFranchise.gm?.name ?? 'N/A'}</span>
            </div>
            {selectedFranchise.agms && selectedFranchise.agms.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">AGMs:</span>
                <span className="text-slate-200">{selectedFranchise.agms.map(a => a.name).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Selector - only show when franchise is selected */}
      {selectedFranchise && (
        <div className="glass rounded-xl p-6 card-glow relative z-20">
          <h2 className="text-lg font-semibold text-neon-cyan mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-neon-cyan to-emerald-400 rounded-full"></span>
            Select Team from {selectedFranchise.prefix}
          </h2>
          
          <div className="relative">
            <button
              onClick={() => { setTeamDropdownOpen(!teamDropdownOpen); setFranchiseDropdownOpen(false); }}
              className="w-full max-w-lg flex items-center justify-between gap-3 px-4 py-3 rounded-xl glass text-left neon-border-hover cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Users size={20} className={selectedTeam ? 'text-neon-cyan' : 'text-slate-400'} />
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Team</div>
                  <span className={selectedTeam ? 'text-slate-200' : 'text-slate-400'}>
                    {selectedTeam ? `${selectedTeam.name} (${selectedTeam.tier.name})` : 'Choose a team...'}
                  </span>
                </div>
              </div>
              <ChevronDown size={20} className={`text-slate-400 transition-transform ${teamDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {teamDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full max-w-lg rounded-xl shadow-2xl dropdown-menu z-50">
                {selectedFranchise.teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setSelectedTeam(team);
                      setTeamDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                      selectedTeam?.id === team.id
                        ? 'bg-neon-cyan/15 text-neon-cyan'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Users size={18} />
                    <div>
                      <span className="font-medium">{team.name}</span>
                      <div className="text-xs text-slate-500">
                        {team.tier.name} · {team.players.length} players · MMR Cap: {team.tier.mmrCap}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Stats & Roster */}
      {selectedTeam && (
        <>
          {/* Team Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="glass rounded-xl p-4 card-glow">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-neon-blue opacity-70" />
                <span className="text-xs uppercase tracking-wider text-slate-400">Players</span>
              </div>
              <div className="text-2xl font-bold text-neon-blue">{teamRosterWithStats.length}</div>
            </div>
            <div className="glass rounded-xl p-4 card-glow">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-neon-cyan opacity-70" />
                <span className="text-xs uppercase tracking-wider text-slate-400">Total MMR</span>
              </div>
              <div className="text-2xl font-bold text-neon-cyan">
                {teamRosterWithStats.reduce((sum, p) => sum + p.franchisePlayer.mmr, 0)}
              </div>
              <div className="text-xs text-slate-500">Cap: {selectedTeam.tier.mmrCap}</div>
            </div>
            {teamStats && (
              <>
                <div className="glass rounded-xl p-4 card-glow">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={16} className="text-neon-purple opacity-70" />
                    <span className="text-xs uppercase tracking-wider text-slate-400">Games</span>
                  </div>
                  <div className="text-2xl font-bold text-neon-purple">{teamStats.totalGames}</div>
                </div>
                <div className="glass rounded-xl p-4 card-glow">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={16} className="text-emerald-400 opacity-70" />
                    <span className="text-xs uppercase tracking-wider text-slate-400">Avg Rating</span>
                  </div>
                  <div className={`text-2xl font-bold ${ratingColor(teamStats.avgRating)}`}>
                    {teamStats.avgRating.toFixed(3)}
                  </div>
                </div>
                <div className="glass rounded-xl p-4 card-glow">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-neon-cyan opacity-70" />
                    <span className="text-xs uppercase tracking-wider text-slate-400">Avg ADR</span>
                  </div>
                  <div className="text-2xl font-bold text-neon-cyan">{teamStats.avgAdr.toFixed(1)}</div>
                </div>
                <div className="glass rounded-xl p-4 card-glow">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-yellow-400 opacity-70" />
                    <span className="text-xs uppercase tracking-wider text-slate-400">Avg KAST</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{(teamStats.avgKast * 100).toFixed(1)}%</div>
                </div>
                <div className="glass rounded-xl p-4 card-glow">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-emerald-400 opacity-70" />
                    <span className="text-xs uppercase tracking-wider text-slate-400">Team K/D</span>
                  </div>
                  <div className={`text-2xl font-bold ${teamStats.kdRatio >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {teamStats.kdRatio.toFixed(2)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Team Roster */}
          <div className="glass rounded-xl p-6 card-glow">
            <h2 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-neon-purple to-neon-pink rounded-full"></span>
              <Users size={18} className="opacity-80" />
              {selectedTeam.name} Roster
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neon-blue/10">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Player</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">MMR</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Games</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Rating</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">K/D/A</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">ADR</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">KAST</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRosterWithStats.map((player, i) => (
                    <tr
                      key={player.franchisePlayer.steam64Id}
                      className={`border-b border-white/5 table-row-hover ${
                        i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 flex items-center justify-center text-sm font-bold text-neon-purple border border-neon-purple/30 shadow-lg shadow-neon-purple/10">
                            {player.franchisePlayer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold">{player.franchisePlayer.name}</span>
                            {player.isCaptain && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                ⭐ Captain
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{player.franchisePlayer.mmr}</td>
                      <td className="px-4 py-3">
                        {player.cscPlayer && (
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPlayerTypeColor(player.cscPlayer.type)}`}>
                            {getPlayerTypeLabel(player.cscPlayer.type)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{player.stats?.games ?? '-'}</td>
                      <td className="px-4 py-3">
                        {player.stats ? (
                          <span className={`font-bold text-lg ${ratingColor(player.stats.finalRating)}`}>
                            {player.stats.finalRating.toFixed(3)}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {player.stats ? `${player.stats.kills} / ${player.stats.deaths} / ${player.stats.assists}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{player.stats?.adr.toFixed(1) ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {player.stats ? `${(player.stats.kast * 100).toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty States */}
      {!selectedFranchise && (
        <div className="glass rounded-xl p-12 card-glow text-center">
          <Building2 size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No Franchise Selected</h3>
          <p className="text-slate-500">Select a franchise above to view your teams.</p>
          <p className="text-slate-600 text-sm mt-2">{franchises.length} franchises available</p>
        </div>
      )}

      {selectedFranchise && !selectedTeam && (
        <div className="glass rounded-xl p-12 card-glow text-center">
          <Users size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No Team Selected</h3>
          <p className="text-slate-500">Select a team from {selectedFranchise.name} to view the roster and stats.</p>
        </div>
      )}

      {/* Free Agents Summary */}
      {freeAgents.length > 0 && (
        <div className="glass rounded-xl p-6 card-glow">
          <h2 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-neon-cyan to-emerald-400 rounded-full"></span>
            Free Agent Pool
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-blue">
                {freeAgents.filter(p => p.type === 'FREE_AGENT').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Free Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-cyan">
                {freeAgents.filter(p => p.type === 'DRAFT_ELIGIBLE').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Draft Eligible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-purple">
                {freeAgents.filter(p => p.type === 'PERMANENT_FREE_AGENT').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Perm FAs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-300">
                {freeAgents.length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Available</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
