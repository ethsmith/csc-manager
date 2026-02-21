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

export default function MapRatings({ player }: Props) {
  const maps = [
    { name: 'Ancient', rating: player.ancientRating, games: player.ancientGames },
    { name: 'Anubis', rating: player.anubisRating, games: player.anubisGames },
    { name: 'Dust2', rating: player.dust2Rating, games: player.dust2Games },
    { name: 'Inferno', rating: player.infernoRating, games: player.infernoGames },
    { name: 'Mirage', rating: player.mirageRating, games: player.mirageGames },
    { name: 'Nuke', rating: player.nukeRating, games: player.nukeGames },
    { name: 'Overpass', rating: player.overpassRating, games: player.overpassGames },
  ].filter((m) => m.games > 0);

  if (maps.length === 0) {
    return (
      <div className="glass rounded-xl p-6 card-glow group">
        <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-gradient-to-b from-neon-purple to-neon-pink rounded-full"></span>
          Map Ratings
        </h3>
        <p className="text-slate-500 text-sm">No map data available</p>
      </div>
    );
  }

  const data = {
    labels: maps.map((m) => m.name),
    datasets: [
      {
        label: 'Rating',
        data: maps.map((m) => m.rating),
        backgroundColor: maps.map((m) =>
          m.rating >= 1.0
            ? 'rgba(0, 212, 255, 0.7)'
            : m.rating >= 0.8
              ? 'rgba(168, 85, 247, 0.6)'
              : 'rgba(236, 72, 153, 0.6)'
        ),
        borderColor: maps.map((m) =>
          m.rating >= 1.0 ? '#00d4ff' : m.rating >= 0.8 ? '#a855f7' : '#ec4899'
        ),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 212, 255, 0.08)' },
        ticks: { color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(0, 212, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { weight: 600 as const } },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(10, 14, 26, 0.9)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        titleColor: '#00d4ff',
        bodyColor: '#e2e8f0',
        callbacks: {
          afterLabel: (ctx: { dataIndex: number }) => `Games: ${maps[ctx.dataIndex].games}`,
        },
      },
    },
  };

  return (
    <div className="glass rounded-xl p-6 card-glow group">
      <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-neon-purple to-neon-pink rounded-full"></span>
        Map Ratings
      </h3>
      <div style={{ height: Math.max(160, maps.length * 50) }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
