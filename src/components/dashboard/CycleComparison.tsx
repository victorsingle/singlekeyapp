import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useOKRStore } from '../../stores/okrStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function CycleComparison() {
  const { cycles = [], allOkrs = [] } = useOKRStore();

  if (!cycles.length || !allOkrs.length) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Comparação entre Ciclos
        </h2>
        <p className="text-sm text-gray-500">Nenhum dado disponível no momento.</p>
      </div>
    );
  }

  const sortedCycles = [...cycles]
    .filter(c => !!c.start_date_text)
    .sort(
      (a, b) =>
        new Date(`${a.start_date_text}T00:00:00`).getTime() -
        new Date(`${b.start_date_text}T00:00:00`).getTime()
    );

  const chartData = sortedCycles.map(cycle => {
    const okrsDoCiclo = allOkrs?.filter(okr =>
      String(okr.cycle_id) === String(cycle.id)
    ) ?? [];

    const keyResults = okrsDoCiclo.flatMap(okr => okr.key_results || []);

    const progressValues = keyResults
      .map(kr => kr.progress)
      .filter(p => typeof p === 'number');

    const total = progressValues.reduce((sum, p) => sum + (p ?? 0), 0);
    const avg = progressValues.length > 0 ? Math.round(total / progressValues.length) : 0;

    return {
      name: cycle.name,
      achieved: avg,
      notAchieved: 100 - avg
    };
  });

  const data = {
    labels: chartData.map(c => c.name),
    datasets: [
      {
        label: 'Atingido',
        data: chartData.map(c => c.achieved),
        backgroundColor: '#22c55e',
        stack: 'total',
      },
      {
        label: 'Não Atingido',
        data: chartData.map(c => c.notAchieved),
        backgroundColor: '#ef4444',
        stack: 'total',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          color: '#e5e7eb'
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: number) => `${value}%`,
        },
        grid: {
          color: '#e5e7eb'
        }
      }
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Comparação entre Ciclos
      </h2>
      <div style={{ height: `${sortedCycles.length * 80 + 130}px` }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
