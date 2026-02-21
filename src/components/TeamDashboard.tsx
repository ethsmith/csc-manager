import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Trophy, ChevronDown, Star, TrendingUp, Target, Shield, Loader2, Crown, X, UserPlus, ArrowRightLeft, Crosshair, Zap, Eye, Award, Flame, ExternalLink } from 'lucide-react';
import type { GroupedPlayer, StatMode, PlayerStats } from '../types';
import { fetchFranchises, fetchAllPlayers, getPlayerTypeLabel, getPlayerTypeColor, type Franchise, type CscPlayer, type FranchiseTeam, type FranchisePlayer } from '../fetchFranchises';
import ModeToggle from './ModeToggle';

interface Props {
  players: GroupedPlayer[];
}

interface RosterPlayer {
  franchisePlayer: FranchisePlayer;
  cscPlayer: CscPlayer | undefined;
  groupedPlayer: GroupedPlayer | undefined;
  stats: PlayerStats | null;
  isCaptain: boolean;
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

const STORAGE_KEY_FRANCHISE = 'fragg_selected_franchise';
const STORAGE_KEY_TEAM = 'fragg_selected_team';

export default function TeamDashboard({ players }: Props) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<StatMode>('regulation');
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<FranchiseTeam | null>(null);
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [allCscPlayers, setAllCscPlayers] = useState<CscPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const [showReplacementFinder, setShowReplacementFinder] = useState(false);
  const [playerToReplace, setPlayerToReplace] = useState<RosterPlayer | null>(null);
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);

  useEffect(() => {
    Promise.all([fetchFranchises(), fetchAllPlayers()])
      .then(([franchiseData, playerData]) => {
        setFranchises(franchiseData);
        setAllCscPlayers(playerData);
        
        // Restore saved franchise selection from localStorage
        const savedFranchiseName = localStorage.getItem(STORAGE_KEY_FRANCHISE);
        const savedTeamName = localStorage.getItem(STORAGE_KEY_TEAM);
        
        if (savedFranchiseName) {
          const franchise = franchiseData.find(f => f.name === savedFranchiseName);
          if (franchise) {
            setSelectedFranchise(franchise);
            
            if (savedTeamName) {
              const team = franchise.teams.find(t => t.name === savedTeamName);
              if (team) {
                setSelectedTeam(team);
              }
            }
          }
        }
        
        setHasRestoredFromStorage(true);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setHasRestoredFromStorage(true);
        setLoading(false);
      });
  }, []);
  
  // Save franchise selection to localStorage (only after initial restore)
  useEffect(() => {
    if (!hasRestoredFromStorage) return;
    
    if (selectedFranchise) {
      localStorage.setItem(STORAGE_KEY_FRANCHISE, selectedFranchise.name);
    } else {
      localStorage.removeItem(STORAGE_KEY_FRANCHISE);
    }
  }, [selectedFranchise, hasRestoredFromStorage]);
  
  // Save team selection to localStorage (only after initial restore)
  useEffect(() => {
    if (!hasRestoredFromStorage) return;
    
    if (selectedTeam) {
      localStorage.setItem(STORAGE_KEY_TEAM, selectedTeam.name);
    } else {
      localStorage.removeItem(STORAGE_KEY_TEAM);
    }
  }, [selectedTeam, hasRestoredFromStorage]);

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

  // Find replacement candidates for a player
  const replacementCandidates = useMemo(() => {
    if (!playerToReplace || !selectedTeam) return [];

    const currentTeamMmr = teamRosterWithStats.reduce((sum, p) => sum + p.franchisePlayer.mmr, 0);
    const mmrWithoutPlayer = currentTeamMmr - playerToReplace.franchisePlayer.mmr;
    const maxReplacementMmr = selectedTeam.tier.mmrCap - mmrWithoutPlayer;

    // Get all FA/DE/PFA players that fit within MMR and are in the same tier
    const candidates = allCscPlayers
      .filter((p) => 
        ['FREE_AGENT', 'DRAFT_ELIGIBLE', 'PERMANENT_FREE_AGENT'].includes(p.type) &&
        p.mmr <= maxReplacementMmr &&
        p.tier?.name === selectedTeam.tier.name
      )
      .map((cscPlayer) => {
        const groupedPlayer = players.find((gp) => gp.steamId === cscPlayer.steam64Id);
        let stats: PlayerStats | null = null;
        if (groupedPlayer) {
          const entries = mode === 'regulation' ? groupedPlayer.regulation : groupedPlayer.scrim;
          const entry = entries.find((e) => e.tier === selectedTeam.tier.name);
          stats = entry?.stats ?? (entries.length > 0 ? entries[0].stats : null);
        }
        return { cscPlayer, groupedPlayer, stats };
      })
      .sort((a, b) => {
        // Sort by rating (best first), then by MMR efficiency
        if (a.stats && b.stats) return b.stats.finalRating - a.stats.finalRating;
        if (a.stats) return -1;
        if (b.stats) return 1;
        return b.cscPlayer.mmr - a.cscPlayer.mmr;
      })
      .slice(0, 20); // Top 20 candidates

    return candidates;
  }, [playerToReplace, selectedTeam, teamRosterWithStats, allCscPlayers, players, mode]);

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

          {/* Team Analysis */}
          {teamStats && teamRosterWithStats.filter(p => p.stats).length > 0 && (
            <div className="glass rounded-xl p-6 card-glow">
              <h2 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></span>
                <TrendingUp size={18} className="opacity-80" />
                Team Analysis
              </h2>
              
              <div className="space-y-4">
                {/* MMR Budget */}
                {(() => {
                  const totalMmr = teamRosterWithStats.reduce((sum, p) => sum + p.franchisePlayer.mmr, 0);
                  const mmrRemaining = selectedTeam.tier.mmrCap - totalMmr;
                  const mmrUsagePct = (totalMmr / selectedTeam.tier.mmrCap) * 100;
                  return (
                    <div className="bg-gradient-to-r from-neon-blue/10 to-transparent rounded-xl p-4 border border-neon-blue/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-neon-blue">MMR Budget</div>
                        <div className="text-sm">
                          <span className="text-slate-400">Used: </span>
                          <span className={`font-bold ${mmrUsagePct > 95 ? 'text-red-400' : mmrUsagePct > 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {totalMmr}
                          </span>
                          <span className="text-slate-500"> / {selectedTeam.tier.mmrCap}</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${mmrUsagePct > 95 ? 'bg-red-500' : mmrUsagePct > 80 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(mmrUsagePct, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-sm">
                        {mmrRemaining > 0 ? (
                          <span className="text-emerald-400">{mmrRemaining} MMR available for upgrades</span>
                        ) : (
                          <span className="text-red-400">At MMR cap - must cut MMR to make changes</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Performance Issues */}
                {(() => {
                  const playersWithStats = teamRosterWithStats.filter(p => p.stats && p.stats.games >= 3);
                  const underperformers = playersWithStats.filter(p => p.stats!.finalRating < 0.9);
                  const lowKast = playersWithStats.filter(p => p.stats!.kast < 0.65);
                  const negativeKd = playersWithStats.filter(p => p.stats!.kills / p.stats!.deaths < 0.85);
                  
                  const issues: { player: string; issue: string; severity: 'warning' | 'critical' }[] = [];
                  
                  underperformers.forEach(p => {
                    issues.push({
                      player: p.franchisePlayer.name,
                      issue: `Low rating (${p.stats!.finalRating.toFixed(2)})`,
                      severity: p.stats!.finalRating < 0.8 ? 'critical' : 'warning'
                    });
                  });
                  
                  lowKast.forEach(p => {
                    if (!underperformers.includes(p)) {
                      issues.push({
                        player: p.franchisePlayer.name,
                        issue: `Low KAST (${(p.stats!.kast * 100).toFixed(0)}%)`,
                        severity: p.stats!.kast < 0.55 ? 'critical' : 'warning'
                      });
                    }
                  });

                  negativeKd.forEach(p => {
                    if (!underperformers.includes(p) && !lowKast.includes(p)) {
                      issues.push({
                        player: p.franchisePlayer.name,
                        issue: `Negative K/D (${(p.stats!.kills / p.stats!.deaths).toFixed(2)})`,
                        severity: 'warning'
                      });
                    }
                  });

                  if (issues.length === 0) {
                    return (
                      <div className="bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl p-4 border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Star size={16} />
                          <span className="font-semibold">All players performing well</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">No significant performance concerns detected.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-gradient-to-r from-red-500/10 to-transparent rounded-xl p-4 border border-red-500/20">
                      <div className="flex items-center gap-2 text-red-400 mb-3">
                        <Target size={16} />
                        <span className="font-semibold">Performance Concerns ({issues.length})</span>
                      </div>
                      <div className="space-y-2">
                        {issues.slice(0, 4).map((issue, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{issue.player}</span>
                            <span className={issue.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}>
                              {issue.issue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Roster Composition */}
                {(() => {
                  const playersWithStats = teamRosterWithStats.filter(p => p.stats);
                  const avgRating = playersWithStats.length > 0 
                    ? playersWithStats.reduce((sum, p) => sum + p.stats!.finalRating, 0) / playersWithStats.length 
                    : 0;
                  const ratingSpread = playersWithStats.length > 1
                    ? Math.max(...playersWithStats.map(p => p.stats!.finalRating)) - Math.min(...playersWithStats.map(p => p.stats!.finalRating))
                    : 0;
                  const mmrEfficiency = playersWithStats.length > 0
                    ? avgRating / (teamRosterWithStats.reduce((sum, p) => sum + p.franchisePlayer.mmr, 0) / playersWithStats.length) * 1000
                    : 0;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <div className="text-xs text-slate-400 uppercase mb-1">Team Avg Rating</div>
                        <div className={`text-2xl font-bold ${ratingColor(avgRating)}`}>
                          {avgRating.toFixed(3)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {avgRating >= 1.1 ? 'Excellent' : avgRating >= 1.0 ? 'Good' : avgRating >= 0.9 ? 'Average' : 'Needs work'}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <div className="text-xs text-slate-400 uppercase mb-1">Rating Spread</div>
                        <div className={`text-2xl font-bold ${ratingSpread > 0.3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {ratingSpread.toFixed(3)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {ratingSpread > 0.4 ? 'Unbalanced' : ratingSpread > 0.25 ? 'Moderate' : 'Well balanced'}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <div className="text-xs text-slate-400 uppercase mb-1">MMR Efficiency</div>
                        <div className={`text-2xl font-bold ${mmrEfficiency > 2.8 ? 'text-emerald-400' : mmrEfficiency > 2.4 ? 'text-neon-blue' : 'text-yellow-400'}`}>
                          {mmrEfficiency.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Rating per 1K MMR
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(() => {
                    const totalMmr = teamRosterWithStats.reduce((sum, p) => sum + p.franchisePlayer.mmr, 0);
                    const mmrRemaining = selectedTeam.tier.mmrCap - totalMmr;
                    const playersWithStats = teamRosterWithStats.filter(p => p.stats);
                    const worstPlayer = playersWithStats.sort((a, b) => a.stats!.finalRating - b.stats!.finalRating)[0];
                    
                    return worstPlayer ? (
                      <button
                        onClick={() => {
                          setPlayerToReplace(worstPlayer);
                          setShowReplacementFinder(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-cyan/10 text-neon-cyan text-sm hover:bg-neon-cyan/20 transition-colors border border-neon-cyan/20"
                      >
                        <ArrowRightLeft size={14} />
                        Find upgrade for {worstPlayer.franchisePlayer.name}
                        {mmrRemaining > 0 && <span className="text-xs opacity-70">(+{mmrRemaining} MMR available)</span>}
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          )}

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
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRosterWithStats.map((player, i) => (
                    <tr
                      key={player.franchisePlayer.steam64Id}
                      className={`border-b border-white/5 table-row-hover cursor-pointer ${
                        i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                      }`}
                      onClick={() => setSelectedPlayer(player)}
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
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayerToReplace(player);
                            setShowReplacementFinder(true);
                          }}
                          className="p-1.5 rounded-lg bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
                          title="Find replacements"
                        >
                          <ArrowRightLeft size={16} />
                        </button>
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
      {freeAgents.length > 0 && !selectedTeam && (
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

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedPlayer(null)}>
          <div className="glass rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto card-glow" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 flex items-center justify-center text-2xl font-bold text-neon-purple border-2 border-neon-purple/30">
                  {selectedPlayer.franchisePlayer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold gradient-text">{selectedPlayer.franchisePlayer.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-400">{selectedTeam?.name}</span>
                    {selectedPlayer.isCaptain && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        ⭐ Captain
                      </span>
                    )}
                    {selectedPlayer.cscPlayer && (
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPlayerTypeColor(selectedPlayer.cscPlayer.type)}`}>
                        {getPlayerTypeLabel(selectedPlayer.cscPlayer.type)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">MMR</div>
                  <div className="text-2xl font-bold text-neon-cyan">{selectedPlayer.franchisePlayer.mmr}</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Rating</div>
                  <div className={`text-2xl font-bold ${selectedPlayer.stats ? ratingColor(selectedPlayer.stats.finalRating) : 'text-slate-500'}`}>
                    {selectedPlayer.stats?.finalRating.toFixed(3) ?? '-'}
                  </div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Games</div>
                  <div className="text-2xl font-bold text-neon-purple">{selectedPlayer.stats?.games ?? '-'}</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">K/D</div>
                  <div className={`text-2xl font-bold ${selectedPlayer.stats && selectedPlayer.stats.kills / selectedPlayer.stats.deaths >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedPlayer.stats ? kdRatio(selectedPlayer.stats.kills, selectedPlayer.stats.deaths) : '-'}
                  </div>
                </div>
              </div>

              {selectedPlayer.stats && (
                <>
                  {/* Combat Stats */}
                  <div className="glass rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
                      <Crosshair size={18} /> Combat Stats
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Kills</div>
                        <div className="text-xl font-bold text-emerald-400">{selectedPlayer.stats.kills}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Deaths</div>
                        <div className="text-xl font-bold text-red-400">{selectedPlayer.stats.deaths}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Assists</div>
                        <div className="text-xl font-bold text-neon-blue">{selectedPlayer.stats.assists}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">ADR</div>
                        <div className="text-xl font-bold text-neon-cyan">{selectedPlayer.stats.adr.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Headshot %</div>
                        <div className="text-xl font-bold text-yellow-400">{pct(selectedPlayer.stats.headshotPct)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">KAST</div>
                        <div className="text-xl font-bold text-neon-purple">{pct(selectedPlayer.stats.kast)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Impact</div>
                        <div className="text-xl font-bold text-neon-blue">{selectedPlayer.stats.roundImpact?.toFixed(2) ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Rounds</div>
                        <div className="text-xl font-bold text-slate-300">{selectedPlayer.stats.roundsPlayed}</div>
                      </div>
                    </div>
                  </div>

                  {/* Opening Duels */}
                  <div className="glass rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                      <Zap size={18} /> Opening Duels
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Opening Kills</div>
                        <div className="text-xl font-bold text-emerald-400">{selectedPlayer.stats.openingKills}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Opening Deaths</div>
                        <div className="text-xl font-bold text-red-400">{selectedPlayer.stats.openingDeaths}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Opening Win %</div>
                        <div className="text-xl font-bold text-neon-cyan">
                          {selectedPlayer.stats.openingKills + selectedPlayer.stats.openingDeaths > 0
                            ? pct(selectedPlayer.stats.openingKills / (selectedPlayer.stats.openingKills + selectedPlayer.stats.openingDeaths))
                            : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Trade Kills</div>
                        <div className="text-xl font-bold text-neon-blue">{selectedPlayer.stats.tradeKills}</div>
                      </div>
                    </div>
                  </div>

                  {/* Clutches & Multi-kills */}
                  <div className="glass rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                      <Award size={18} /> Clutches & Multi-kills
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Clutch Rounds</div>
                        <div className="text-xl font-bold text-slate-300">{selectedPlayer.stats.clutchRounds}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">Clutch Wins</div>
                        <div className="text-xl font-bold text-emerald-400">{selectedPlayer.stats.clutchWins}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">1v1 Win Rate</div>
                        <div className="text-xl font-bold text-neon-blue">{pct(selectedPlayer.stats.clutch1v1WinPct)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">1v1 Wins</div>
                        <div className="text-xl font-bold text-yellow-400">{selectedPlayer.stats.clutch1v1Wins}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10">
                      <div>
                        <div className="text-xs text-slate-400 uppercase">2K</div>
                        <div className="text-xl font-bold text-slate-300">{selectedPlayer.stats.twoK}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">3K</div>
                        <div className="text-xl font-bold text-neon-blue">{selectedPlayer.stats.threeK}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">4K</div>
                        <div className="text-xl font-bold text-neon-purple">{selectedPlayer.stats.fourK}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase">5K (Ace)</div>
                        <div className="text-xl font-bold text-yellow-400">{selectedPlayer.stats.fiveK}</div>
                      </div>
                    </div>
                  </div>

                  {/* AWP & Utility */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-neon-cyan mb-4 flex items-center gap-2">
                        <Eye size={18} /> AWP Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">AWP Kills</div>
                          <div className="text-xl font-bold text-neon-cyan">{selectedPlayer.stats.awpKills}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 uppercase">AWP K/R</div>
                          <div className="text-xl font-bold text-neon-blue">
                            {selectedPlayer.stats.awpKillsPerRound?.toFixed(3) ?? '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="glass rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
                        <Flame size={18} /> Utility
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">Util Damage</div>
                          <div className="text-xl font-bold text-orange-400">{selectedPlayer.stats.utilityDamage}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 uppercase">Flash Assists</div>
                          <div className="text-xl font-bold text-yellow-400">{selectedPlayer.stats.flashAssists}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!selectedPlayer.stats && (
                <div className="text-center py-8 text-slate-500">
                  <Target size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No stats available for this player in {mode} mode.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                {selectedPlayer.groupedPlayer && (
                  <button
                    onClick={() => {
                      navigate('/', { state: { selectedSteamId: selectedPlayer.franchisePlayer.steam64Id } });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neon-blue/15 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/25 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={18} />
                    View Full Stats
                  </button>
                )}
                <button
                  onClick={() => {
                    setPlayerToReplace(selectedPlayer);
                    setShowReplacementFinder(true);
                    setSelectedPlayer(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft size={18} />
                  Find Replacements
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Finder Modal */}
      {showReplacementFinder && playerToReplace && selectedTeam && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowReplacementFinder(false); setPlayerToReplace(null); }}>
          <div className="glass rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto card-glow" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold gradient-text flex items-center gap-3">
                  <UserPlus size={28} />
                  Replacement Finder
                </h2>
                <p className="text-slate-400 mt-1">
                  Finding replacements for <span className="text-neon-purple font-semibold">{playerToReplace.franchisePlayer.name}</span> ({playerToReplace.franchisePlayer.mmr} MMR)
                </p>
              </div>
              <button onClick={() => { setShowReplacementFinder(false); setPlayerToReplace(null); }} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              {/* MMR Budget Info */}
              <div className="glass rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Current Team MMR</div>
                    <div className="text-xl font-bold text-neon-blue">
                      {teamRosterWithStats.reduce((sum, p) => sum + p.franchisePlayer.mmr, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">MMR Cap</div>
                    <div className="text-xl font-bold text-neon-purple">{selectedTeam.tier.mmrCap}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Player's MMR</div>
                    <div className="text-xl font-bold text-red-400">{playerToReplace.franchisePlayer.mmr}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Max Replacement MMR</div>
                    <div className="text-xl font-bold text-emerald-400">
                      {selectedTeam.tier.mmrCap - (teamRosterWithStats.reduce((sum, p) => sum + p.franchisePlayer.mmr, 0) - playerToReplace.franchisePlayer.mmr)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              {replacementCandidates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neon-blue/10">
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Player</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">MMR</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Status</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Games</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Rating</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400 cursor-help" title="Rating per 1K MMR - Higher = better value">Efficiency</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">ADR</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">KAST</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">vs Current</th>
                      </tr>
                    </thead>
                    <tbody>
                      {replacementCandidates.map((candidate, i) => {
                        const ratingDiff = candidate.stats && playerToReplace.stats
                          ? candidate.stats.finalRating - playerToReplace.stats.finalRating
                          : null;
                        const efficiency = candidate.stats && candidate.cscPlayer.mmr > 0
                          ? (candidate.stats.finalRating / candidate.cscPlayer.mmr) * 1000
                          : null;
                        return (
                          <tr
                            key={candidate.cscPlayer.steam64Id}
                            className={`border-b border-white/5 table-row-hover ${
                              i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/30 to-emerald-400/30 flex items-center justify-center text-sm font-bold text-neon-cyan border border-neon-cyan/30">
                                  {candidate.cscPlayer.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold">{candidate.cscPlayer.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300 font-medium">{candidate.cscPlayer.mmr}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPlayerTypeColor(candidate.cscPlayer.type)}`}>
                                {getPlayerTypeLabel(candidate.cscPlayer.type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{candidate.stats?.games ?? '-'}</td>
                            <td className="px-4 py-3">
                              {candidate.stats ? (
                                <span className={`font-bold ${ratingColor(candidate.stats.finalRating)}`}>
                                  {candidate.stats.finalRating.toFixed(3)}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {efficiency !== null ? (
                                <span className={`font-bold ${efficiency > 3.0 ? 'text-emerald-400' : efficiency > 2.5 ? 'text-neon-cyan' : 'text-yellow-400'}`}>
                                  {efficiency.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-300">{candidate.stats?.adr.toFixed(1) ?? '-'}</td>
                            <td className="px-4 py-3 text-slate-300">{candidate.stats ? pct(candidate.stats.kast) : '-'}</td>
                            <td className="px-4 py-3">
                              {ratingDiff !== null ? (
                                <span className={`font-bold ${ratingDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {ratingDiff >= 0 ? '+' : ''}{ratingDiff.toFixed(3)}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No eligible replacements found</p>
                  <p className="text-sm mt-2">No FA/DE/PFA players in {selectedTeam.tier.name} fit within the MMR budget.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
