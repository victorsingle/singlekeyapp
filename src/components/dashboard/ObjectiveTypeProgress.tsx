import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ArrowRight } from 'lucide-react';
import { InfoTooltip } from '../../components/InfoTooltip';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useOKRStore } from '../../stores/okrStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ObjectiveTypeProgressProps {
  onTypeClick: (type: 'strategic' | 'tactical' | 'operational') => void;
}

export function ObjectiveTypeProgress({ onTypeClick }: ObjectiveTypeProgressProps) {
  const { okrs, selectedCycleId } = useOKRStore();

  const cycleOKRs = okrs.filter((okr) => okr.cycle_id === selectedCycleId);

  const calculateAverage = (type: 'strategic' | 'tactical' | 'operational') => {
    const filtered = cycleOKRs.filter((okr) => okr.type === type);
    if (filtered.length === 0) return 0;

    // Média dos progressos dos KRs de cada objetivo
    const total = filtered.reduce((sum, okr) => {
      const krList = Array.isArray(okr.keyResults) ? okr.keyResults : [];
    
      const krTotal = krList.reduce((ksum: number, kr: any) => ksum + (kr.progress ?? 0), 0);
      const krAvg = krList.length > 0 ? krTotal / krList.length : 0;
    
      return sum + krAvg;
    }, 0);

    return Math.round(total / filtered.length);
  };

  const strategic = calculateAverage('strategic');
  const tactical = calculateAverage('tactical');
  const operational = calculateAverage('operational');

  const data = {
    labels: ['Estratégico', 'Tático', 'Operacional'],
    datasets: [
      {
        data: [strategic, tactical, operational],
        backgroundColor: ['#f97316', '#8b5cf6', '#3b82f6'],
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Progresso: ${context.raw}%`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: { display: false },
        ticks: {
          callback: (value: number) => `${value}%`,
        },
      },
      y: {
        grid: { display: false },
      },
    },
    onClick: (_: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const types = ['strategic', 'tactical', 'operational'];
        onTypeClick(types[index] as any);
      }
    },
  };

  const handleClick = (_: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const types = ['strategic', 'tactical', 'operational'];
      onTypeClick(types[index] as any);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 min-h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 whitespace-nowrap">
          Nível
        </h2>
        <div><InfoTooltip content="Exibe quantos KRs são estratégicos, táticos ou operacionais dentro do ciclo."  className="justfy-end mt-2" /></div>
      </div>
      <div style={{ height: '180px' }}>
        <Bar
          data={data}
          options={{
            ...options,
            maintainAspectRatio: false,
            indexAxis: 'y', // gráfico horizontal
            responsive: true,
          }}
          onClick={handleClick}
        />
      </div>
    </div>
  );
}
