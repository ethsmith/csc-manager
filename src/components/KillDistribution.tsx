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
          'rgba(79, 143, 255, 0.6)',
          'rgba(99, 155, 255, 0.6)',
          'rgba(119, 167, 255, 0.6)',
          'rgba(167, 139, 250, 0.6)',
          'rgba(244, 114, 182, 0.6)',
        ],
        borderColor: [
          '#4f8fff',
          '#639bff',
          '#77a7ff',
          '#a78bfa',
          '#f472b6',
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
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { weight: 600 as const } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', stepSize: 1 },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(12, 12, 24, 0.95)',
        borderColor: 'rgba(79, 143, 255, 0.2)',
        borderWidth: 1,
        titleColor: '#4f8fff',
        bodyColor: '#e2e8f0',
      },
    },
  };

  return (
    <div className="glass rounded-xl p-6 card-glow group">
      <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-neon-cyan to-accent rounded-full"></span>
        Kill Rounds Distribution
      </h3>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
