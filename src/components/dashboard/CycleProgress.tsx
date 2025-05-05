import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useOKRStore } from '../../stores/okrStore';
import { InfoTooltip } from '../../components/InfoTooltip';
// import { format } from 'date-fns';
// import { ptBR } from 'date-fns/locale';

export function CycleProgress() {
  
  const { selectedCycleId, cycles, getCycleAverageProgress } = useOKRStore();
  const selectedCycle = cycles.find(c => c.id === selectedCycleId);

  const progress = getCycleAverageProgress(selectedCycleId);

  const getProgressColor = (value: number) => {
    if (value >= 70) return '#22c55e'; // green-500
    if (value >= 40) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  if (!selectedCycle) return null;

  return (
    <div className="relative bg-white rounded-2xl shadow-md p-6">
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Visão Geral
          </h2>
        </div>
        <div><InfoTooltip content="Mostra o progresso médio dos resultados-chave no ciclo atual."  className="justfy-end mt-2" /></div>
      </div>
      
      <div className="flex justify-center">
        <div className="w-[150px] h-[150px]">
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            styles={buildStyles({
              pathColor: getProgressColor(progress),
              textColor: getProgressColor(progress),
              trailColor: '#f3f4f6'
            })}
          />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-600">
          Média Geral do Ciclo
        </p>
      </div>
    </div>
  );
}
