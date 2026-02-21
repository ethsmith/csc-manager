import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { PlayerStats } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  player: PlayerStats;
}

export default function SideComparison({ player }: Props) {
  const tAdr = player.tRoundsPlayed > 0 ? Math.round(player.tDamage / player.tRoundsPlayed) : 0;
  const ctAdr = player.ctRoundsPlayed > 0 ? Math.round(player.ctDamage / player.ctRoundsPlayed) : 0;
  const tKpr = player.tRoundsPlayed > 0 ? +(player.tKills / player.tRoundsPlayed).toFixed(2) : 0;
  const ctKpr = player.ctRoundsPlayed > 0 ? +(player.ctKills / player.ctRoundsPlayed).toFixed(2) : 0;

  const data = {
    labels: ['Rating', 'ADR', 'KPR', 'KAST'],
    datasets: [
      {
        label: 'T Side',
        data: [player.tRating, tAdr, tKpr, player.tKast],
        backgroundColor: 'rgba(234, 179, 8, 0.6)',
        borderColor: '#eab308',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'CT Side',
        data: [player.ctRating, ctAdr, ctKpr, player.ctKast],
        backgroundColor: 'rgba(0, 212, 255, 0.6)',
        borderColor: '#00d4ff',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(0, 212, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { weight: 600 as const } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 212, 255, 0.08)' },
        ticks: { color: '#94a3b8' },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle' as const },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 26, 0.9)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        titleColor: '#00d4ff',
        bodyColor: '#e2e8f0',
      },
    },
  };

  return (
    <div className="glass rounded-xl p-6 card-glow group">
      <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-yellow-400 to-neon-blue rounded-full"></span>
        T vs CT Side
      </h3>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
