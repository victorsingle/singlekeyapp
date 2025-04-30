import React from 'react';
import { MoreHorizontal, MoreVertical } from 'lucide-react';
import { useOKRStore } from '../../stores/okrStore';
import { DropdownMenu, DropdownMenuItem } from '../../components/DropdownMenu';

interface KeyResult {
  id: string;
  text: string;
  metric?: string;
  initial_value?: number;
  current_value?: number;
  target_value?: number;
  kr_type?: 'roofshot' | 'moonshot';
  confidence_flag?: 'high' | 'medium' | 'low';
}

interface KeyResultEditableProps {
  kr: KeyResult;
}

export function KeyResultEditable({ kr }: KeyResultEditableProps) {
  const { updateKeyResult, deleteKeyResult } = useOKRStore();


  const handleBlur = (field: string, value: any) => {
    if (value === undefined || value === '') return;
  
    const numericFields = ['initial_value', 'current_value', 'target_value'];
    if (numericFields.includes(field) && isNaN(value)) return;
  
    updateKeyResult(kr.id, { [field]: value });
  };

  const handleDelete = async () => {
    await deleteKeyResult(kr.id);
  };

  const calculateProgress = (initial: number, current: number, target: number): number => {
    const denominator = target - initial;
    if (denominator === 0) return 0;
    const progress = ((current - initial) / denominator) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
  };
  
  const progress = calculateProgress(
    kr.initial_value ?? 0,
    kr.current_value ?? 0,
    kr.target_value ?? 0
  );

  return (
    <div className="bg-gray-50 border rounded-md p-3 relative">
      {/* Header */}
      <div className="flex items-center absolute right-2 top-2">
      <DropdownMenu
          trigger={
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          }
        >
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            Excluir
          </DropdownMenuItem>
        </DropdownMenu>
        </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-full">
          <label className="text-xs text-gray-500">Título do KR</label>
          <input
            className="border rounded px-2 py-1 text-sm w-full"
            defaultValue={kr.text}
            onBlur={(e) => handleBlur('text', e.target.value)}
          />
        </div>

        <div>
        <label className="text-xs text-gray-500">Ambição</label>
        <select
            className="border rounded px-2 py-1 text-sm w-32"
            defaultValue={kr.kr_type || ''}
            onBlur={(e) => handleBlur('kr_type', e.target.value)}
        >
            <option value="">Selecione</option>
            <option value="roofshot">Roofshot</option>
            <option value="moonshot">Moonshot</option>
        </select>
        </div>
      </div>

      {/* Grid */}
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
            className="border rounded px-2 py-1 text-sm w-full"
            defaultValue={kr.metric || ''}
            onBlur={(e) => handleBlur('metric', e.target.value)}
          />
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-full"
            defaultValue={kr.initial_value ?? 0}
            onBlur={(e) => handleBlur('initial_value', Number(e.target.value))}
          />
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-full"
            defaultValue={kr.current_value ?? 0}
            onBlur={(e) => handleBlur('current_value', Number(e.target.value))}
          />
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-full"
            defaultValue={kr.target_value ?? 0}
            onBlur={(e) => handleBlur('target_value', Number(e.target.value))}
          />
          <div className="flex gap-2 justify-left">

            {/* Bolinhas poderiam vir aqui */}
            <button
                className={`w-6 h-6 rounded-full bg-green-400 border ${kr.confidence_flag === 'high' ? 'ring-2 ring-gray-500' : ''}`}
                onClick={() => handleBlur('confidence_flag', 'high')}
            />
            <button
                className={`w-6 h-6 rounded-full bg-yellow-400 border ${kr.confidence_flag === 'medium' ? 'ring-2 ring-gray-500' : ''}`}
                onClick={() => handleBlur('confidence_flag', 'medium')}
            />
            <button
                className={`w-6 h-6 rounded-full bg-red-400 border ${kr.confidence_flag === 'low' ? 'ring-2 ring-gray-500' : ''}`}
                onClick={() => handleBlur('confidence_flag', 'low')}
            />

          {/* Barra de progresso */}
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mt-2 ml-2">
            <div className="h-full bg-blue-400"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
