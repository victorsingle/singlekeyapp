import React from 'react';
import { OKRCardEditable } from '../OKRCardEditable';
import { useOKRStore } from '../../stores/okrStore';


export function OkrDetailsView({ okrs, viewMode, setViewMode }) {
  const { keyResults, expandedIds, toggleExpand, links } = useOKRStore();

  if (!okrs || !Array.isArray(okrs)) return null;
  if (!links || !Array.isArray(links)) return null;

  const allLinkedIds = new Set([
    ...links.map(l => l.source_okr_id),
    ...links.map(l => l.target_okr_id),
  ]);

  const okrsComVinculo = okrs.filter(o => allLinkedIds.has(o.id));
  const okrsSemVinculo = okrs.filter(o => !allLinkedIds.has(o.id));

  return (
    <div className="space-y-8">
      {/* Mensagem quando não há OKRs */}
      {okrsSemVinculo.length === 0 && okrsComVinculo.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          Nenhum OKR cadastrado ainda neste ciclo. Clique no botão abaixo para começar!
        </div>
      )}
      {/* OKRs COM vínculo */}
      {okrsComVinculo.length > 0 && (
        <div className="w-full auto p-6 border rounded-lg border-gray-400 border-dashed mt-5 mb-10">
          <h2 className="w-max text-sm font-semibold text-gray-800 -mt-9 mb-4 bg-gray-50 p-2">OKRs com Vínculo</h2>
          <div className="space-y-4">
            {okrsComVinculo.map(okr => {
              const incoming = links.filter(l => l.target_okr_id === okr.id);
              const indentLevel =
                okr.type === 'tactical' ? 1 :
                okr.type === 'operational' ? 2 : 0;

              return (
                <OKRCardEditable
                  key={okr.id}
                  id={okr.id}
                  type={okr.type}
                  status={okr.status}
                  objective={okr.objective}
                  keyResults={keyResults.filter(kr => kr.okr_id === okr.id)}
                  expanded={expandedIds.includes(okr.id)}
                  onToggleExpand={() => toggleExpand(okr.id)}
                  indentLevel={indentLevel}
                />
              );
            })}
          </div>
        </div>
      )}


      {/* OKRs SEM vínculo */}
      {okrsSemVinculo.length > 0 && (
        <div className="w-full auto p-6 border rounded-lg border-gray-400 border-dashed">
          <h2 className="w-max text-sm font-semibold text-gray-800 -mt-9 mb-4 bg-gray-50 p-2">OKRs sem Vínculo</h2>
          <div className="space-y-4">
            {okrsSemVinculo.map(okr => (
              <OKRCardEditable
                key={okr.id}
                id={okr.id}
                type={okr.type}
                status={okr.status}
                objective={okr.objective}
                keyResults={keyResults.filter(kr => kr.okr_id === okr.id)}
                expanded={expandedIds.includes(okr.id)}
                onToggleExpand={() => toggleExpand(okr.id)}
                indentLevel={0}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
