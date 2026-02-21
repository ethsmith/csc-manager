import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import type { GroupedPlayer, StatMode } from './types';
import { fetchPlayerStats } from './fetchData';
import Navbar from './components/Navbar';
import PlayerList from './components/PlayerList';
import PlayerDashboard from './components/PlayerDashboard';
import TeamDashboard from './components/TeamDashboard';
import { Loader2 } from 'lucide-react';

interface LocationState {
  selectedSteamId?: string;
}

function PlayersPage({ players }: { players: GroupedPlayer[] }) {
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const initialPlayer = state?.selectedSteamId 
    ? players.find(p => p.steamId === state.selectedSteamId) ?? null
    : null;
  
  const [selectedPlayer, setSelectedPlayer] = useState<GroupedPlayer | null>(initialPlayer);
  const [mode, setMode] = useState<StatMode>('regulation');
  
  useEffect(() => {
    if (state?.selectedSteamId) {
      const player = players.find(p => p.steamId === state.selectedSteamId);
      if (player) {
        setSelectedPlayer(player);
      }
      window.history.replaceState({}, document.title);
    }
  }, [state?.selectedSteamId, players]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {selectedPlayer ? (
        <PlayerDashboard
          groupedPlayer={selectedPlayer}
          allGroupedPlayers={players}
          mode={mode}
          onModeChange={setMode}
          onBack={() => setSelectedPlayer(null)}
        />
      ) : (
        <PlayerList
          players={players}
          mode={mode}
          onModeChange={setMode}
          onSelect={setSelectedPlayer}
        />
      )}
    </div>
  );
}

function TeamPage({ players }: { players: GroupedPlayer[] }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <TeamDashboard players={players} />
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
            <Route path="/" element={<PlayersPage players={players} />} />
            <Route path="/team" element={<TeamPage players={players} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
