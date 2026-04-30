import { NavLink, useLocation } from 'react-router-dom';
import { Trophy, Users, Building2, Medal, Sparkles } from 'lucide-react';
import SeasonSelector from './SeasonSelector';

interface Props {
  season?: number;
  onSeasonChange?: (season: number) => void;
}

export default function Navbar({ season, onSeasonChange }: Props) {
  const location = useLocation();
  const isPlayersActive = location.pathname === '/' || location.pathname.startsWith('/players');
  const isTeamsActive = location.pathname.startsWith('/teams');
  const isLeaderboardActive = location.pathname.startsWith('/leaderboard');
  const isArchetypesActive = location.pathname.startsWith('/archetypes');

  return (
    <nav className="glass border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/10 to-neon-purple/10 border border-accent/20 group-hover:border-accent/40 transition-colors">
              <Trophy size={24} className="text-accent" />
            </div>
            <span className="text-xl font-bold gradient-text">FRAGG 3.0</span>
          </NavLink>

          <div className="flex items-center gap-1">
            <NavLink
              to="/players"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isPlayersActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Users size={18} />
              Players
            </NavLink>
            <NavLink
              to="/teams"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isTeamsActive
                  ? 'bg-neon-purple/10 text-neon-purple'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Building2 size={18} />
              Teams
            </NavLink>
            <NavLink
              to="/leaderboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isLeaderboardActive
                  ? 'bg-yellow-400/10 text-yellow-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Medal size={18} />
              Leaderboard
            </NavLink>
            <NavLink
              to="/archetypes"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isArchetypesActive
                  ? 'bg-neon-purple/10 text-neon-purple'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Sparkles size={18} />
              Archetypes
            </NavLink>
          </div>
          {season != null && onSeasonChange && (
            <SeasonSelector season={season} onChange={onSeasonChange} />
          )}
        </div>
      </div>
    </nav>
  );
}
