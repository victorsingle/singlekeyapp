import React from 'react';
import { ChevronDown, ChevronUp, Target, Trash2 } from 'lucide-react';
import type { GeneratedOKR } from '../lib/openai';

interface OKRPreviewEditorProps {
  okr: GeneratedOKR;
  onChange: (okr: GeneratedOKR) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function OKRPreviewEditor({ okr, onChange, onSave, onCancel }: OKRPreviewEditorProps) {
  const updateKeyResult = (index: number, updates: Partial<typeof okr.keyResults[0]>) => {
    const newKeyResults = [...okr.keyResults];
    newKeyResults[index] = { ...newKeyResults[index], ...updates };
    onChange({ ...okr, keyResults: newKeyResults });
  };

  const removeKeyResult = (index: number) => {
    onChange({
      ...okr,
      keyResults: okr.keyResults.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Objetivo
          </label>
          <textarea
            value={okr.objective}
            onChange={(e) => onChange({ ...okr, objective: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            value={okr.type}
            onChange={(e) => onChange({ ...okr, type: e.target.value as 'moonshot' | 'roofshot' })}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="moonshot">Moonshot</option>
            <option value="roofshot">Roofshot</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Key Results</h3>
        {okr.keyResults.map((kr, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <textarea
                value={kr.text}
                onChange={(e) => updateKeyResult(index, { text: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
              <button
                onClick={() => removeKeyResult(index)}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Métrica
                </label>
                <input
                  type="text"
                  value={kr.metric || ''}
                  onChange={(e) => updateKeyResult(index, { metric: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Taxa de retenção"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unidade
                </label>
                <input
                  type="text"
                  value={kr.unit || ''}
                  onChange={(e) => updateKeyResult(index, { unit: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: %"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Valor Inicial
                </label>
                <input
                  type="number"
                  value={kr.initialValue || ''}
                  onChange={(e) => updateKeyResult(index, { initialValue: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Valor Alvo
                </label>
                <input
                  type="number"
                  value={kr.targetValue || ''}
                  onChange={(e) => updateKeyResult(index, { targetValue: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Salvar OKR
        </button>
      </div>
    </div>
  );
}