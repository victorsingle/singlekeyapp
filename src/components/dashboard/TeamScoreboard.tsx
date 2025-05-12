import React from 'react';
import clsx from 'clsx';
import { Users } from 'lucide-react';
import { InfoTooltip } from '../../components/InfoTooltip';

interface KeyResult {
  id: string;
  texto: string;
  nivel: 'Estratégico' | 'Tático' | 'Operacional';
  baseline?: string;
  target?: string;
  progresso?: number;
}

interface TeamData {
  teamName: string;
  keyResults: KeyResult[];
}

interface TeamScoreboardProps {
  data: TeamData[];
}

function traduzirNivel(nivel: string): string {
  switch (nivel) {
    case 'strategic':
      return 'Estratégico';
    case 'tactical':
      return 'Tático';
    case 'operational':
      return 'Operacional';
    default:
      return '-';
  }
}

export function TeamScoreboard({ data }: TeamScoreboardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Resultados por Time</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Visualize aqui os times associados a cada resultado-chave deste ciclo.
          </p>
        </div>
        <div className="-mt-4">
          <InfoTooltip content="Agrupamento dos Key Results por time responsável, incluindo baseline e progresso." className="justify-end" />
        </div>
      </div>
      {data.map((team) => (
        <div key={team.teamName} className="bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 mt-2">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 mr-1" />
                      {team.teamName}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Nível
                  </th>
                  <th className="px-6 py-3 text-left text-sm text-center font-medium text-gray-500">
                    Baseline
                  </th>
                  <th className="px-6 py-3 text-left text-sm text-center font-medium text-gray-500">
                    Alvo
                  </th>
                  <th className="px-6 py-3 text-left text-sm text-center font-medium text-gray-500">
                    Atingimento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {team.keyResults.map((kr) => (
                  <tr key={kr.id}>
                    <td className="px-6 py-2 text-xs text-gray-900">{kr.texto}</td>
                    <td className="px-6 py-2 text-xs text-gray-700">{traduzirNivel(kr.nivel)}</td>
                    <td className="px-6 py-2 text-xs text-center text-gray-700">{kr.baseline || '-'}</td>
                    <td className="px-6 py-2 text-xs text-center text-gray-700">{kr.target || '-'}</td>
                    <td className={clsx("px-6 py-2 text-xs text-center text-blue-700 font-semibold", {
                      'text-green-600': (kr.progresso ?? 0) >= 100
                    })}>
                      {kr.progresso !== undefined ? `${kr.progresso.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
