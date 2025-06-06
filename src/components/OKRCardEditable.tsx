import React, { useState, useEffect } from 'react';
import { MoreHorizontal, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { useOKRStore } from '../stores/okrStore';
import { DropdownMenu, DropdownMenuItem } from '../components/DropdownMenu';
import { KeyResultEditable } from '../components/okr/KeyResultEditable';
import { usePermissions } from '../hooks/usePermissions';


interface KeyResult {
  id: string;
  text: string;
  metric?: string;
  initial_value?: number;
  current_value?: number;
  target_value?: number;
  confidence_flag?: 'high' | 'medium' | 'low';
}

interface OKRCardEditableProps {
  id: string;
  type: 'strategic' | 'tactical' | 'operational';
  status: 'draft' | 'active' | 'done';
  objective: string;
  keyResults: KeyResult[];
  expanded: boolean;
  onToggleExpand: () => void;
  indentLevel?: number;
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

function OKRCardEditableComponent({
  id,
  type,
  objective,
  status,
  keyResults = [],
  expanded,
  onToggleExpand,
  indentLevel = 0 
}: OKRCardEditableProps) {

  const isMobile = useIsMobile();

  const { updateOKR, deleteOKR, createKeyResults } = useOKRStore();

  const { isAdmin, isChampion } = usePermissions();

  const handleAddKeyResult = async () => {
    try {
      await createKeyResults(
        [
          {
            text: '',
            metric: '',
            initial_value: 0,
            current_value: 0,
            target_value: 0,
            confidence_flag: undefined,
            unit: '',
            progress: 0,
          }
        ],
        id
      );
    } catch (error) {
      console.error('Erro ao criar novo Key Result:', error);
    }
  };

  const handleObjectiveBlur = (newObjective: string) => {
    if (newObjective !== objective) {
      updateOKR(id, { objective: newObjective });
    }
  };

  const handleTypeBlur = (newType: 'strategic' | 'tactical' | 'operational') => {
    if (newType !== type) {
      updateOKR(id, { type: newType });
    }
  };

  let prefix = '';

  if (indentLevel === 1) prefix = '✦ ';
  else if (indentLevel === 2) prefix = '● ';
  else if (type === 'strategic') prefix = '★ ';

  prefix +=
    type === 'strategic' ? 'Estratégico' :
    type === 'tactical' ? 'Tático' :
    'Operacional';

  return (
    <div>
      <div className="relative bg-white border rounded-lg shadow-sm p-4 -mt-2 hover:shadow-lg transition duration-300">
        {/* Status e ações */}
        <div className="absolute top-[5px] right-2 flex items-center text-xs cursor-pointer">
          <button
            data-guide='okrs-view'
            onClick={onToggleExpand}
            className="text-xs text-blue-600 mr-2 mt-0"
          >
            <span className="flex items-center gap-1">
              {expanded ? (
                <>
                  <EyeOff className="w-4 h-4 text-blue-600" />
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600 " />
                </>
              )}
            </span>
          </button>
          {(isAdmin || isChampion) && (
          <>
          <DropdownMenu
            trigger={
              <button className="text-gray-400 hover:text-gray-600 mt-1 ">
                <MoreVertical className="w-5 h-5" />
              </button>
            }
          >
            <DropdownMenuItem
              onClick={() => deleteOKR(id)}
              className="text-red-600"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenu>
          </>
          )}
        </div>

        {/* Objetivo */}
        <div className="flex justify-between items-start">
          <div className="w-full">
            <span className="text-xs text-gray-500">{prefix}</span>

            <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
            
            {isMobile ? (
              <textarea
                className="border text-sm rounded py-2 pl-2 pr-2 resize-none overflow-hidden leading-snug min-h-[2.5rem] sm:py-1 sm:min-h-0 box-content w-[calc(100%-1rem)]"
                defaultValue={objective}
                placeholder="Título do Objetivo"
                rows={1}
                onInput={(e) => {
                  const target = e.currentTarget
                  target.style.height = 'auto'
                  target.style.height = `${target.scrollHeight}px`
                }}
                onBlur={(e) => handleObjectiveBlur(e.target.value)}
              />
            ) : (
              <input
                type="text"
                className="border text-sm rounded px-2 py-1 w-full"
                defaultValue={objective}
                placeholder="Título do Objetivo"
                onBlur={(e) => handleObjectiveBlur(e.target.value)}
              />
            )}
            
              <select
                className="border text-sm rounded px-2 py-1 w-full md:w-40"
                defaultValue={type}
                onBlur={(e) =>
                  handleTypeBlur(e.target.value as 'strategic' | 'tactical' | 'operational')
                }
              >
                <option value="strategic">Estratégico</option>
                <option value="tactical">Tático</option>
                <option value="operational">Operacional</option>
              </select>
            </div>
          </div>
        </div>


        {/* Key Results */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {keyResults.map((kr) => (
              <KeyResultEditable key={kr.id} kr={kr} />
            ))}

            <div className="text-center mt-4">
              <button
                onClick={handleAddKeyResult}
                className="text-xs text-blue-600 hover:underline"
              >
                + Adicionar Key Result
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function areEqual(prev: OKRCardEditableProps, next: OKRCardEditableProps) {
  return (
    prev.id === next.id &&
    prev.expanded === next.expanded &&
    prev.objective === next.objective &&
    prev.type === next.type &&
    prev.status === next.status &&
    JSON.stringify(prev.keyResults) === JSON.stringify(next.keyResults)
  );
}

export const OKRCardEditable = React.memo(OKRCardEditableComponent);
