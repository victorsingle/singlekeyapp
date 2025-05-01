import React from 'react';
import { X } from 'lucide-react';
import { useOKRStore } from '../../stores/okrStore';

interface DetailPanelProps {
  title: string;
  type: string;
  onClose: () => void;
}

export function DetailPanel({ title, type, onClose }: DetailPanelProps) {
  const { keyResults, okrs, selectedCycleId } = useOKRStore();

  // Filtrar todos os OKRs do ciclo selecionado
  const cycleOKRs = okrs.filter((okr) => okr.cycle_id === selectedCycleId);

  // Agrupar todos os KRs do ciclo
  const cycleKRs = cycleOKRs.flatMap((okr) => okr.keyResults ?? []);

  // Função para obter o último check-in
  const getLatestCheckin = (kr: any) => {
    if (!kr.checkins || kr.checkins.length === 0) return null;
    return [...kr.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
  };

  // Filtrar os KRs com base no tipo de drilldown
  let krsToShow: any[] = [];

  if (['moonshot', 'roofshot'].includes(type)) {
    krsToShow = cycleKRs.filter((kr) => kr.kr_type === type);
  } else if (['high', 'medium', 'low'].includes(type)) {
    krsToShow = cycleKRs.filter((kr) => {
      const flag = kr.confidence_flag ?? getLatestCheckin(kr)?.confidence_flag ?? null;
      return flag === type;
    });
  } else {
    // Exibe todos os KRs se o tipo não for reconhecido
    krsToShow = cycleKRs;
  }

  // Cor baseada na flag de confiança
  const getColorByConfidence = (flag: string | null | undefined) => {
    if (flag === 'high') return 'bg-green-500';
    if (flag === 'medium') return 'bg-yellow-400';
    if (flag === 'low') return 'bg-red-500';
    return 'bg-gray-300';
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed !mt-0 top-0 left-0 w-screen h-screen bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Painel lateral */}
      <div className="fixed inset-0 z-50 flex justify-end !mt-0">
        <div className="h-[calc(100%-64px)] mt-[64px] w-96 bg-white shadow-lg flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fechar painel"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {krsToShow.length > 0 ? (
              <div className="space-y-4">
                {krsToShow.map((kr) => {
                  const latest = getLatestCheckin(kr);
                  const progress = kr.progress ?? latest?.progress ?? 0;
                  const flag = kr.confidence_flag ?? latest?.confidence_flag ?? null;

                  return (
                    <div
                      key={kr.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-sm text-gray-700 mb-3">{kr.text}</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${getColorByConfidence(flag)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-right">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center mt-12">
                Nenhum resultado encontrado para este critério.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
