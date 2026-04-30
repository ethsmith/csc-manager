import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { PlayerStats } from '../types';
import { statRanges } from '../statRanges';

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
          m.rating >= statRanges.mapRating.good
            ? 'rgba(52, 211, 153, 0.7)'
            : m.rating >= statRanges.mapRating.average
              ? 'rgba(79, 143, 255, 0.7)'
              : m.rating >= statRanges.mapRating.average
                ? 'rgba(148, 163, 184, 0.6)'
                : 'rgba(248, 113, 113, 0.6)'
        ),
        borderColor: maps.map((m) =>
          m.rating >= statRanges.mapRating.good ? '#4f8fff' : m.rating >= statRanges.mapRating.average ? '#94a3b8' : '#f87171'
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
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { weight: 600 as const } },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(12, 12, 24, 0.95)',
        borderColor: 'rgba(79, 143, 255, 0.2)',
        borderWidth: 1,
        titleColor: '#4f8fff',
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
