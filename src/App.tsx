import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import type { GroupedPlayer, StatMode } from './types';
import { fetchPlayerStats } from './fetchData';
import Navbar from './components/Navbar';
import PlayerList from './components/PlayerList';
import PlayerDashboard from './components/PlayerDashboard';
import TeamDashboard from './components/TeamDashboard';
import DevStatAverages from './components/DevStatAverages';
import Leaderboard from './components/Leaderboard';
import { Loader2 } from 'lucide-react';

function PlayersListPage({ players }: { players: GroupedPlayer[] }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<StatMode>('regulation');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PlayerList
        players={players}
        mode={mode}
        onModeChange={setMode}
        onSelect={(player) => navigate(`/players/${player.steamId}`)}
      />
    </div>
  );
}

function PlayerDetailPage({ players }: { players: GroupedPlayer[] }) {
  const { steamId } = useParams<{ steamId: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<StatMode>('regulation');

  const player = players.find((p) => p.steamId === steamId);

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
        onModeChange={setMode}
        onBack={() => navigate('/players')}
      />
    </div>
  );
}

function TeamsPage({ players }: { players: GroupedPlayer[] }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <TeamDashboard players={players} />
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

function LeaderboardPage({ players }: { players: GroupedPlayer[] }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <Leaderboard players={players} />
    </div>
  );
}

function App() {
  const [players, setPlayers] = useState<GroupedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayerStats()
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-neon-blue/20 blur-xl animate-pulse" />
            <Loader2 size={56} className="animate-spin text-neon-blue mx-auto relative" />
          </div>
          <p className="text-slate-300 text-lg font-medium gradient-text">Loading player stats...</p>
          <p className="text-slate-500 text-sm">Fetching data from Google Sheets</p>
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
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<PlayersListPage players={players} />} />
            <Route path="/players" element={<PlayersListPage players={players} />} />
            <Route path="/players/:steamId" element={<PlayerDetailPage players={players} />} />
            <Route path="/teams" element={<TeamsPage players={players} />} />
            <Route path="/leaderboard" element={<LeaderboardPage players={players} />} />
            <Route path="/dev" element={<DevPage players={players} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
