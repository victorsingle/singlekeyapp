import React, { useState, useEffect } from 'react';
import { MoreHorizontal, MoreVertical } from 'lucide-react';
import { useOKRStore } from '../../stores/okrStore';
import { DropdownMenu, DropdownMenuItem } from '../../components/DropdownMenu';
import { usePermissions } from '../../hooks/usePermissions';
import { TeamAssignment } from '../../components/TeamAssignment';


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

//Responsividade Título Objetivo

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}

export function KeyResultEditable({ kr }: KeyResultEditableProps) {
 
  const isMobile = useIsMobile();
 
  const { updateKeyResult, deleteKeyResult } = useOKRStore();
  
  const { isAdmin, isChampion } = usePermissions();


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
    <div className="bg-gray-100 border border-gray-400 border-dashed rounded-md p-3 relative">
      {/* Header */}
      <div className="flex items-center absolute right-2 top-2">
      {(isAdmin || isChampion) && (
                  <>
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
        </>
      )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Título do KR</label>

            {isMobile ? (
              <textarea
                className="border text-sm rounded py-2 pl-2 pr-2 resize-none overflow-hidden leading-snug min-h-[3.5rem] sm:py-1 sm:min-h-0 box-content w-[calc(100%-1rem)] whitespace-pre-wrap break-words"
                defaultValue={kr.text}
                rows={1}
                onInput={(e) => {
                  const target = e.currentTarget
                  target.style.height = 'auto'
                  target.style.height = `${target.scrollHeight}px`
                }}
                onBlur={(e) => handleBlur('text', e.target.value)}
              />
            ) : (
              <input
              className="border rounded px-2 py-1 text-sm w-full"
              defaultValue={kr.text}
              onBlur={(e) => handleBlur('text', e.target.value)}
             />
            )}

            

          </div>

          <div className="w-full md:w-56">
            <label className="text-xs text-gray-500">Tipo</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              defaultValue={kr.kr_type || ''}
              onBlur={(e) => handleBlur('kr_type', e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="roofshot">Factível</option>
              <option value="moonshot">Ambicioso</option>
            </select>
          </div>
        </div>

      {/* Grid */}
      <div className="space-y-2">
      <div className="hidden md:grid grid-cols-5 gap-4 text-xs text-gray-500">
          <label>Métrica</label>
          <label>Baseline</label>
          <label>Atual</label>
          <label>Alvo</label>
          <label>Confiança</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          <div className="flex flex-col">
            <label className="md:hidden text-xs text-gray-500 mb-1">Métrica</label>
            <input
              type="text"
              className="border rounded px-2 py-1 text-sm w-full"
              defaultValue={kr.metric || ''}
              onBlur={(e) => handleBlur('metric', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="md:hidden text-xs text-gray-500 mb-1">Baseline</label>
            <input
              type="number"
              className="border rounded px-2 py-1 text-sm w-full"
              defaultValue={kr.initial_value ?? 0}
              onBlur={(e) => handleBlur('initial_value', Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col">
            <label className="md:hidden text-xs text-gray-500 mb-1">Atual</label>
            <input
              type="number"
              className="border rounded px-2 py-1 text-sm w-full"
              defaultValue={kr.current_value ?? 0}
              onBlur={(e) => handleBlur('current_value', Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col">
            <label className="md:hidden text-xs text-gray-500 mb-1">Alvo</label>
            <input
              type="number"
              className="border rounded px-2 py-1 text-sm w-full"
              defaultValue={kr.target_value ?? 0}
              onBlur={(e) => handleBlur('target_value', Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="md:hidden text-xs text-gray-500 mb-1">Confiança</label>
            {/* bolinhas + progresso permanecem */}
            <div className="flex gap-2 items-center">
              <button className={`w-6 h-6 rounded-full bg-green-400 border ${kr.confidence_flag === 'high' ? 'ring-2 ring-gray-500' : ''}`} onClick={() => handleBlur('confidence_flag', 'high')} />
              <button className={`w-6 h-6 rounded-full bg-yellow-400 border ${kr.confidence_flag === 'medium' ? 'ring-2 ring-gray-500' : ''}`} onClick={() => handleBlur('confidence_flag', 'medium')} />
              <button className={`w-6 h-6 rounded-full bg-red-400 border ${kr.confidence_flag === 'low' ? 'ring-2 ring-gray-500' : ''}`} onClick={() => handleBlur('confidence_flag', 'low')} />
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-blue-400" style={{ width: `${progress ?? 0}%` }} />
            </div>
          </div>
        </div>
        <TeamAssignment krId={kr.id} />
      </div>
    </div>
  );
}
