import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface KRDistributionProps {
  achieved: number;
  inProgress: number;
  stalled: number;
}

export function KRDistribution({ achieved, inProgress, stalled }: KRDistributionProps) {
  const data = {
    labels: ['Atingidos', 'Em Progresso', 'Estagnados'],
    datasets: [
      {
        data: [achieved, inProgress, stalled],
        backgroundColor: [
          '#22c55e', // green-500
          '#3b82f6', // blue-500
          '#ef4444', // red-500
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const total = achieved + inProgress + stalled;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Status dos KRs</h2>
      
      <div className="flex items-center justify-center mb-4">
        <div className="w-64">
          <Doughnut data={data} options={options} />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{achieved}</span> de <span className="font-medium">{total}</span> KRs atingidos
        </p>
      </div>
    </div>
  );
}