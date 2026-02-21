import { useState, useEffect } from 'react';
import type { GroupedPlayer, StatMode } from './types';
import { fetchPlayerStats } from './fetchData';
import PlayerList from './components/PlayerList';
import PlayerDashboard from './components/PlayerDashboard';
import { Loader2 } from 'lucide-react';

function App() {
  const [players, setPlayers] = useState<GroupedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<GroupedPlayer | null>(null);
  const [mode, setMode] = useState<StatMode>('regulation');

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
        <div className="text-center space-y-4">
          <Loader2 size={48} className="animate-spin text-neon-blue mx-auto" />
          <p className="text-slate-400 text-lg">Loading player stats...</p>
          <p className="text-slate-600 text-sm">Fetching data from Google Sheets</p>
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
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

export default App;
