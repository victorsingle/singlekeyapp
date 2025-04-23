// components/dashboard/MatrizPlacar.tsx

import React from 'react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


interface KRCheckin {
  kr_text: string;
  okr_type: 'strategic' | 'tactical' | 'operational';
  progress: number;
  checkins: Record<string, 'green' | 'yellow' | 'red' | null>;
}

interface MatrizPlacarProps {
  data: KRCheckin[];
  dates: string[];
}

export function MatrizPlacar({ data, dates }: MatrizPlacarProps) {
  const getFlagColor = (flag: string | null) => {
    return clsx(
      'w-4 h-4 rounded-full mx-auto',
      flag === 'green' && 'bg-green-500',
      flag === 'yellow' && 'bg-yellow-400',
      flag === 'red' && 'bg-red-500',
      !flag && 'bg-gray-200'
    );
  };

  const getTypeLabel = (type: string) => {
    if (type === 'strategic') return 'Estratégico';
    if (type === 'tactical') return 'Tático';
    return 'Operacional';
  };

  const grouped = data.reduce<Record<string, KRCheckin[]>>((acc, row) => {
    if (!acc[row.okr_type]) acc[row.okr_type] = [];
    acc[row.okr_type].push(row);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full overflow-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Placar</h2>

      <table className="min-w-full text-xs text-left">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-gray-600 font-medium text-sm font-bold">Key Result</th>
            {dates.map(date => (
              <th key={date} className="p-2 text-gray-600 font-medium text-center text-sm font-bold">
                {format(new Date(`${date}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
              </th>
            ))}
            <th className="p-2 text-gray-600 font-medium text-left text-sm font-bold">Progresso</th>
          </tr>
        </thead>
        <tbody>
          {['strategic', 'tactical', 'operational'].map(type => (
            grouped[type]?.map((kr, idx) => (
              <tr key={`${type}-${idx}`} className="border-t border-gray-200">
                <td className="p-2 text-gray-800">{kr.kr_text}</td>
                {dates.map(date => (
                  <td key={date} className="p-2 text-center">
                    <div className={getFlagColor(kr.checkins[date] ?? null)} />
                  </td>
                ))}
                <td className="p-2 text-right">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${kr.progress}%` }}
                    />
                  </div>
                </td>
              </tr>
            )) ?? []
          ))}
        </tbody>
      </table>
    </div>
  );
}
