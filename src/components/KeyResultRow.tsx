import React, { useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface KeyResultRowProps {
  kr: {
    id: string;
    text: string;
    metric?: string;
    initial_value?: number | null;
    current_value?: number | null;
    target_value?: number | null;
    progress: number;
    kr_type: 'moonshot' | 'roofshot';
  };
  okrId: string;
  updateKeyResult: (krId: string, updates: any) => void;
  handleNumericInput: (okrId: string, krId: string, field: string, value: string) => void;
  handleDeleteKeyResult: (krId: string, okrId: string) => void;
  getProgressColor: (progress: number) => string;
  readOnly?: boolean;
}

export function KeyResultRow({
  kr,
  okrId,
  updateKeyResult,
  handleNumericInput,
  handleDeleteKeyResult,
  getProgressColor,
  readOnly = false,
}: KeyResultRowProps) {
  const [metric, setMetric] = useState(kr.metric || '');
  const [initial, setInitial] = useState(kr.initial_value ?? 0);
  const [current, setCurrent] = useState(kr.current_value ?? 0);
  const [target, setTarget] = useState(kr.target_value ?? 0);
  const [text, setText] = useState(kr.text || '');

const [confidenceFlag, setConfidenceFlag] = useState<'green' | 'yellow' | 'red' | null>(kr.confidence_flag ?? null);

const handleConfidenceClick = (selectedColor: 'green' | 'yellow' | 'red') => {
  const updatedFlag = confidenceFlag === selectedColor ? null : selectedColor;
  setConfidenceFlag(updatedFlag); // muda na UI
  updateKeyResult(kr.id, { confidence_flag: updatedFlag }); // persiste no banco
};


 return (
  <div key={kr.id} className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
    {/* Botão de deletar no canto superior direito */}
    {!readOnly && (
      <button
        onClick={() => handleDeleteKeyResult(kr.id, okrId)}
        className="absolute top-0 right-0 text-gray-400 hover:text-red-500 transition-colors z-10"
        title="Excluir KR"
      >
        <X className="w-4 h-4" />
      </button>
    )}

    <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-4">
      <div className="flex-1 w-full space-y-1">
        {readOnly ? (
          <>
            <textarea
              defaultValue={text}
              disabled
              rows={3}
              className="block md:hidden w-full outline-none ring-1 ring-gray-300 rounded-lg p-2 text-sm resize-none"
            />
            <input
              type="text"
              defaultValue={text}
              disabled
              className="hidden md:block w-full outline-none ring-1 ring-gray-300 rounded-lg p-2 text-sm"
            />
          </>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => updateKeyResult(kr.id, { text })}
              rows={3}
              className="block md:hidden w-full outline-none ring-1 ring-gray-300 rounded-lg p-2 text-sm resize-none"
            />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => updateKeyResult(kr.id, { text })}
              className="hidden md:block w-full outline-none ring-1 ring-gray-300 rounded-lg p-2 text-sm"
            />
          </>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-5">
        <label className="block text-sm font-medium text-gray-700">Métrica</label>
        <input
          type="text"
          value={metric}
          disabled={readOnly}
          onChange={(e) => setMetric(e.target.value)}
          onBlur={() => updateKeyResult(kr.id, { metric })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Ambição</label>
        <select
          value={kr.kr_type}
          disabled={readOnly}
          onChange={(e) => {
            if (!readOnly) updateKeyResult(kr.id, { kr_type: e.target.value });
          }}
          className="mt-1 block w-full rounded-md border px-3 py-2.5 text-sm"
        >
          <option value="">Selecione o Tipo</option>
          <option value="moonshot">Moonshot</option>
          <option value="roofshot">Roofshot</option>
        </select>
      </div>

      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700">Inicial</label>
        <input
          type="number"
          value={initial}
          disabled={readOnly}
          onChange={(e) => setInitial(Number(e.target.value))}
          onBlur={() => handleNumericInput(okrId, kr.id, 'initial_value', String(initial))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700">Atual</label>
        <input
          type="number"
          value={current}
          disabled={readOnly}
          onChange={(e) => setCurrent(Number(e.target.value))}
          onBlur={() => handleNumericInput(okrId, kr.id, 'current_value', String(current))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700">Alvo</label>
        <input
          type="number"
          value={target}
          disabled={readOnly}
          onChange={(e) => setTarget(Number(e.target.value))}
          onBlur={() => handleNumericInput(okrId, kr.id, 'target_value', String(target))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Confiança</label>
        <div className="flex space-x-2 mt-1">
            {['green', 'yellow', 'red'].map((color) => (
              <button
                key={color}
                onClick={() => handleConfidenceClick(color as 'green' | 'yellow' | 'red')}
                className={clsx(
                  'w-8 h-8 rounded-full border transition-all duration-200',
                  color === 'green' && 'bg-green-500',
                  color === 'yellow' && 'bg-yellow-400',
                  color === 'red' && 'bg-red-500',
                  confidenceFlag === color ? 'ring-2 ring-offset-1 ring-gray-600' : 'opacity-40'
                )}
                aria-label={`Selecionar confiança: ${color}`}
              />
            ))}
          </div>
      </div>
      
    </div>
  </div>
);


}
