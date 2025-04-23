import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useOKRStore } from '../../stores/okrStore';

interface TypeProgressProps {
  onTypeClick: (type: 'moonshot' | 'roofshot') => void;
}

export function TypeProgress({ onTypeClick }: TypeProgressProps) {
  const { selectedCycleId, okrs } = useOKRStore();

  // Pega os OKRs do ciclo atual
  const cycleOKRs = okrs.filter(okr => okr.cycle_id === selectedCycleId);
  const allKRs = cycleOKRs.flatMap(okr => okr.keyResults ?? []);

  const moonshotsKRs = allKRs.filter(kr => kr.kr_type === 'moonshot');
  const roofshotsKRs = allKRs.filter(kr => kr.kr_type === 'roofshot');

  const getAverageProgress = (krs: typeof allKRs) => {
    if (krs.length === 0) return 0;
    const total = krs.reduce((sum, kr) => sum + (kr.progress ?? 0), 0);
    return Math.round(total / krs.length);
  };

  const moonshots = getAverageProgress(moonshotsKRs);
  const roofshots = getAverageProgress(roofshotsKRs);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-auto md:min-h-[160px]">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Progresso por Ambição</h2>
      
      <div className="space-y-6 pb-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Moonshots</span>
            <button
              onClick={() => onTypeClick('moonshot')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Ver KRs <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-purple-500 rounded-full"
              style={{ width: `${moonshots}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 mt-1">{moonshots}%</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Roofshots</span>
            <button
              onClick={() => onTypeClick('roofshot')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Ver KRs <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
              style={{ width: `${roofshots}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 mt-1">{roofshots}%</span>
        </div>
      </div>
    </div>
  );
}
