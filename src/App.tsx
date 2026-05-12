import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import type { GroupedPlayer, StatMode, PlayerTierBreakdown } from './types';
import { fetchPlayerStats, fetchPlayerMatches } from './fetchData';
import Navbar from './components/Navbar';
import PlayerList from './components/PlayerList';
import PlayerDashboard from './components/PlayerDashboard';
import TeamDashboard from './components/TeamDashboard';
import DevStatAverages from './components/DevStatAverages';
import Leaderboard from './components/Leaderboard';
import Archetypes from './components/Archetypes';
import Drafting from './components/Drafting';
import { Loader2 } from 'lucide-react';

function PlayersListPage({ players, mode }: { players: GroupedPlayer[]; mode: StatMode }) {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PlayerList
        players={players}
        mode={mode}
        onSelect={(player) => navigate(`/players/${player.steamId}`)}
      />
    </div>
  );
}

function PlayerDetailPage({
  players,
  season,
  mode,
  onModeChange,
}: {
  players: GroupedPlayer[];
  season: number;
  mode: StatMode;
  onModeChange: (mode: StatMode) => void;
}) {
  const { steamId } = useParams<{ steamId: string }>();
  const navigate = useNavigate();
  const [tierBreakdown, setTierBreakdown] = useState<PlayerTierBreakdown | null>(null);

  const player = players.find((p) => p.steamId === steamId);

  useEffect(() => {
    if (!steamId) return;
    let cancelled = false;
    setTierBreakdown(null);
    fetchPlayerMatches(steamId, mode, season)
      .then((data) => {
        if (cancelled) return;
        setTierBreakdown(data);
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => { cancelled = true; };
  }, [steamId, mode, season]);

  if (!player) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="glass rounded-xl p-8 card-glow text-center space-y-4">
          <div className="text-4xl">🔍</div>
          <h2 className="text-xl font-bold text-slate-200">Player not found</h2>
          <p className="text-slate-400">No player with Steam ID: {steamId}</p>
          <button
            onClick={() => navigate('/players')}
            className="px-6 py-2 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors cursor-pointer"
          >
            Back to Players
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PlayerDashboard
        groupedPlayer={player}
        allGroupedPlayers={players}
        mode={mode}
        onModeChange={onModeChange}
        onBack={() => navigate('/players')}
        tierBreakdown={tierBreakdown}
      />
    </div>
  );
}

function TeamsPage({ players, mode }: { players: GroupedPlayer[]; mode: StatMode }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <TeamDashboard players={players} mode={mode} />
    </div>
  );
}

function DevPage({ players }: { players: GroupedPlayer[] }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <DevStatAverages players={players} />
    </div>
  );
}

function LeaderboardPage({ players, mode }: { players: GroupedPlayer[]; mode: StatMode }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <Leaderboard players={players} mode={mode} />
    </div>
  );
}

function ArchetypesPage({ players, mode }: { players: GroupedPlayer[]; mode: StatMode }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <Archetypes players={players} mode={mode} />
    </div>
  );
}

function DraftingPage({ players, mode }: { players: GroupedPlayer[]; mode: StatMode }) {
  return <Drafting players={players} mode={mode} />;
}

function App() {
  const [players, setPlayers] = useState<GroupedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState<number>(() => {
    const stored = localStorage.getItem('fragg-season');
    return stored ? Number(stored) : 20;
  });
  const [mode, setMode] = useState<StatMode>(() => {
    const stored = localStorage.getItem('fragg-stat-mode');
    return stored === 'combine' ? 'combine' : 'regulation';
  });

  const handleSeasonChange = useCallback((s: number) => {
    setSeason(s);
    localStorage.setItem('fragg-season', String(s));
  }, []);

  const handleModeChange = useCallback((m: StatMode) => {
    setMode(m);
    localStorage.setItem('fragg-stat-mode', m);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPlayerStats(season)
      .then((data) => {
        if (cancelled) return;
        setPlayers(data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [season]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-neon-blue/20 blur-xl animate-pulse" />
            <Loader2 size={56} className="animate-spin text-neon-blue mx-auto relative" />
          </div>
          <p className="text-slate-300 text-lg font-medium gradient-text">Loading player stats...</p>
          <p className="text-slate-500 text-sm">Fetching data from FRAGG 3.0 API</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-xl p-8 card-glow max-w-md text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-red-400">Failed to load data</h2>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar season={season} onSeasonChange={handleSeasonChange} mode={mode} onModeChange={handleModeChange} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<PlayersListPage players={players} mode={mode} />} />
            <Route path="/players" element={<PlayersListPage players={players} mode={mode} />} />
            <Route path="/players/:steamId" element={<PlayerDetailPage players={players} season={season} mode={mode} onModeChange={handleModeChange} />} />
            <Route path="/teams" element={<TeamsPage players={players} mode={mode} />} />
            <Route path="/leaderboard" element={<LeaderboardPage players={players} mode={mode} />} />
            <Route path="/archetypes" element={<ArchetypesPage players={players} mode={mode} />} />
            <Route path="/drafting" element={<DraftingPage players={players} mode={mode} />} />
            <Route path="/dev" element={<DevPage players={players} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
