import { NavLink } from 'react-router-dom';
import { Trophy, Users, Building2 } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="glass border-b border-neon-blue/20 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 group-hover:border-neon-blue/50 transition-colors">
              <Trophy size={24} className="text-neon-blue" />
            </div>
            <span className="text-xl font-bold gradient-text">FRAGG 3.0</span>
          </NavLink>

          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-neon-blue/15 text-neon-blue'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Users size={18} />
              Players
            </NavLink>
            <NavLink
              to="/team"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-neon-purple/15 text-neon-purple'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Building2 size={18} />
              Team Dashboard
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
