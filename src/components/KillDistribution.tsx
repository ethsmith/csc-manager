import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { PlayerStats } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Props {
  player: PlayerStats;
}

export default function KillDistribution({ player }: Props) {
  const data = {
    labels: ['1K', '2K', '3K', '4K', '5K'],
    datasets: [
      {
        label: 'Round Count',
        data: [player.oneK, player.twoK, player.threeK, player.fourK, player.fiveK],
        backgroundColor: [
          'rgba(0, 212, 255, 0.7)',
          'rgba(0, 180, 255, 0.7)',
          'rgba(0, 140, 255, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(236, 72, 153, 0.7)',
        ],
        borderColor: [
          '#00d4ff',
          '#00b4ff',
          '#008cff',
          '#a855f7',
          '#ec4899',
        ],
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
        ticks: { color: '#94a3b8', stepSize: 1 },
      },
    },
    plugins: {
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
        <span className="w-1.5 h-5 bg-gradient-to-b from-neon-cyan to-neon-blue rounded-full"></span>
        Kill Rounds Distribution
      </h3>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
