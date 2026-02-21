import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  sub?: string;
  color?: string;
}

export default function StatCard({ label, value, icon, sub, color = 'text-neon-blue' }: StatCardProps) {
  return (
    <div className="glass rounded-xl p-4 card-glow transition-all duration-300 neon-border-hover">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={`${color} opacity-80`}>{icon}</span>}
        <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
