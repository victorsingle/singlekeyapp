import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { ArrowRight } from 'lucide-react';
import { useOKRStore } from '../../stores/okrStore';
import 'react-circular-progressbar/dist/styles.css';

interface ConfidenceIndicatorProps {
  onConfidenceClick: (level: 'high' | 'medium' | 'low') => void;
}

export function ConfidenceIndicator({ onConfidenceClick }: ConfidenceIndicatorProps) {
  const { okrs, selectedCycleId } = useOKRStore();

  // KRs do ciclo selecionado
  const cycleKRs = okrs
    .filter(okr => okr.cycle_id === selectedCycleId)
    .flatMap(okr => okr.keyResults ?? []);

  // Agrupamento direto por confidence_flag (sem usar checkins)

  const highConfidence = cycleKRs.filter(kr => kr.confidence_flag === 'high').length;
  const mediumConfidence = cycleKRs.filter(kr => kr.confidence_flag === 'medium').length;
  const lowConfidence = cycleKRs.filter(kr => kr.confidence_flag === 'low').length;

  const total = highConfidence + mediumConfidence + lowConfidence;

  const percent = (value: number) => total > 0 ? (value / total) * 100 : 0;

  const blocks = [
    { label: 'Alta', level: 'high' as const, color: '#22c55e', value: highConfidence },
    { label: 'Média', level: 'medium' as const, color: '#eab308', value: mediumConfidence },
    { label: 'Baixa', level: 'low' as const, color: '#ef4444', value: lowConfidence },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Confiança</h2>

      <div className="flex justify-around w-full">
        {blocks.map(({ level, label, color, value }) => (
          <div key={level} className="flex flex-col items-center">
            <button
              onClick={() => onConfidenceClick(level)}
              className="group focus:outline-none flex flex-col items-center"
            >
              <div className="w-[75px] h-[75px] mt-5">
                <CircularProgressbar
                  value={percent(value)}
                  text={`${value}`}
                  styles={buildStyles({
                    pathColor: color,
                    textColor: color,
                    trailColor: '#f3f4f6',
                  })}
                />
              </div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-black flex items-center justify-center">
                {label}
                <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
