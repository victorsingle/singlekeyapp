import React, { useState } from 'react';
import { MoreHorizontal, ListStart, ListEnd, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';

interface KeyResult {
  id: string;
  text: string;
  metric?: string;
  initialValue?: number;
  targetValue?: number;
  progress?: number;
  confidence?: 'high' | 'medium' | 'low';
}

interface OKRCardEditableProps {
  id: string;
  type: 'strategic' | 'tactical' | 'operational';
  status: 'draft' | 'active' | 'done';
  objective: string;
  keyResults?: KeyResult[];
  level?: number;
}

export function OKRCardEditable({ id, type, level = 0, objective, status, keyResults }: OKRCardEditableProps) {
  const [expanded, setExpanded] = useState(false);

  const prefix = type === 'strategic' ? '★' : type === 'tactical' ? '↳' : '↳↳';
  const indent = level === 0 ? '' : level === 1 ? 'pl-4' : 'pl-8';

  return (
    <div className={indent}>
    <div className={`relative bg-white border rounded-lg shadow-sm p-4 -mt-2 hover:shadow-lg transition duration-300`}>

       {/* Status e ações */}
       <div className="absolute top-[5px] right-2 flex items-center text-xs text-blue-600 cursor-pointer">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 mr-2 mt-0 hover:underline"
          >
            {expanded ? 'Ocultar KRs' : 'Ver KRs'}
          </button>
          <DropdownMenu
            trigger={
              <button className="text-gray-400 hover:text-gray-600 mt-1">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            }
          >
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
          </DropdownMenu>
        </div>

      {/* Título do Objetivo */}
      
        <div className="flex justify-between items-start">
          <div className="w-full">
            <span className="text-xs text-gray-500">{prefix} Objetivo</span>
            
            <div className="flex items-center gap-2 mt-1">
              <input
                className="border text-sm rounded px-2 py-1 w-full"
                placeholder="Título do Objetivo"
                defaultValue={objective}
              />
              
              <select className="border text-sm rounded px-2 py-1 w-40">
                <option value="strategic">Estratégico</option>
                <option value="tactical">Tático</option>
                <option value="operational">Operacional</option>
              </select>

              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                {status}
              </span>
            </div>
          </div>
        </div>


        {/* Key Results */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {keyResults.map((kr, idx) => (
              <div key={kr.id} className="bg-gray-50 border rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-full">
                    <label className="text-xs text-gray-500">Título do KR</label>
                    <input
                      defaultValue={kr.text}
                      placeholder="Nome do KR"
                      className="border rounded px-2 py-1 text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Ambição</label>
                    <select
                      defaultValue={kr.ambition}
                      className="border rounded px-2 py-1 text-sm w-32"
                    >
                      <option value="roofshot">Roofshot</option>
                      <option value="moonshot">Moonshot</option>
                    </select>
                  </div>
                  <DropdownMenu
                    trigger={
                      <button className="mt-5 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    }
                  >
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 text-xs text-gray-500">
                    <label>Métrica</label>
                    <label>Baseline</label>
                    <label>Atual</label>
                    <label>Alvo</label>
                    <label>Confiança</label>
                  </div>

                  <div className="grid grid-cols-5 gap-4 items-center">
                    <input
                      type="text"
                      placeholder="Ex: Clientes Ativos"
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={kr.metric}
                      onChange={(e) => updateKR('metric', e.target.value)}
                    />

                    <input
                      type="number"
                      placeholder="0"
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={kr.baseline}
                      onChange={(e) => updateKR('baseline', e.target.value)}
                    />

                    <input
                      type="number"
                      placeholder="10"
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={kr.current}
                      onChange={(e) => updateKR('current', e.target.value)}
                    />

                    <input
                      type="number"
                      placeholder="20"
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={kr.target}
                      onChange={(e) => updateKR('target', e.target.value)}
                    />

                    <div className="flex gap-2">
                      <button
                        className={`w-4 h-4 rounded-full bg-green-400 border ${kr.confidence === 'alta' ? 'ring-2 ring-black' : ''}`}
                        onClick={() => updateKR('confidence', 'alta')}
                      />
                      <button
                        className={`w-4 h-4 rounded-full bg-yellow-400 border ${kr.confidence === 'media' ? 'ring-2 ring-black' : ''}`}
                        onClick={() => updateKR('confidence', 'media')}
                      />
                      <button
                        className={`w-4 h-4 rounded-full bg-red-400 border ${kr.confidence === 'baixa' ? 'ring-2 ring-black' : ''}`}
                        onClick={() => updateKR('confidence', 'baixa')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button className="text-sm text-blue-600 hover:underline mt-2">
              + Adicionar Novo Key Result
            </button>
          </div>
        )}
      </div>
      </div>
  );
}