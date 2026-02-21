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
    <div className="glass rounded-xl p-4 card-glow neon-border-hover group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className={`${color} opacity-70 group-hover:opacity-100 transition-opacity`}>{icon}</span>}
        <span className="text-xs uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color} transition-transform group-hover:scale-105 origin-left`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1.5">{sub}</div>}
    </div>
  );
}
