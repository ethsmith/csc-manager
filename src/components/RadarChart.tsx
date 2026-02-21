import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { PlayerStats } from '../types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface Props {
  player: PlayerStats;
  allPlayers: PlayerStats[];
}

function percentile(value: number, allValues: number[]): number {
  const sorted = [...allValues].sort((a, b) => a - b);
  const idx = sorted.findIndex((v) => v >= value);
  return idx === -1 ? 100 : Math.round((idx / sorted.length) * 100);
}

export default function PerformanceRadar({ player, allPlayers }: Props) {
  const metrics = [
    { key: 'adr' as const, label: 'ADR' },
    { key: 'kpr' as const, label: 'KPR' },
    { key: 'kast' as const, label: 'KAST' },
    { key: 'headshotPct' as const, label: 'HS%' },
    { key: 'survival' as const, label: 'Survival' },
    { key: 'openingKillsPerRound' as const, label: 'Entry' },
    { key: 'tradeKillsPerRound' as const, label: 'Trade' },
    { key: 'utilityDamagePerRound' as const, label: 'Util DMG' },
  ];

  const data = {
    labels: metrics.map((m) => m.label),
    datasets: [
      {
        label: player.name,
        data: metrics.map((m) =>
          percentile(
            player[m.key],
            allPlayers.map((p) => p[m.key])
          )
        ),
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        borderColor: '#00d4ff',
        borderWidth: 2,
        pointBackgroundColor: '#00d4ff',
        pointBorderColor: '#00d4ff',
        pointHoverBackgroundColor: '#00fff2',
        pointHoverBorderColor: '#00fff2',
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          color: 'rgba(148, 163, 184, 0.5)',
          backdropColor: 'transparent',
          font: { size: 10 },
        },
        grid: {
          color: 'rgba(0, 212, 255, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 212, 255, 0.1)',
        },
        pointLabels: {
          color: '#94a3b8',
          font: { size: 12, weight: 600 as const },
        },
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
          label: (ctx: { raw: unknown; label: string }) => `${ctx.label}: ${ctx.raw}th percentile`,
        },
      },
    },
  };

  return (
    <div className="glass rounded-xl p-6 card-glow group">
      <h3 className="text-lg font-semibold text-neon-blue mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-neon-blue to-neon-purple rounded-full"></span>
        Performance Radar (Percentile)
      </h3>
      <div className="h-80">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}
