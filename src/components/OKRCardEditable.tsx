import React from 'react';
import { MoreHorizontal, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { useOKRStore } from '../stores/okrStore';
import { DropdownMenu, DropdownMenuItem } from '../components/DropdownMenu';
import { KeyResultEditable } from '../components/okr/KeyResultEditable';


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
  const { updateOKR, deleteOKR, createKeyResults } = useOKRStore();

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

  if (indentLevel === 1) prefix = '↳ ';
  else if (indentLevel === 2) prefix = '↳↳ ';
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
        </div>

        {/* Objetivo */}
        <div className="flex justify-between items-start">
          <div className="w-full">
            <span className="text-xs text-gray-500">{prefix}</span>

            <div className="flex items-center gap-2 mt-1">
              <input
                className="border text-sm rounded px-2 py-1 w-full"
                defaultValue={objective}
                placeholder="Título do Objetivo"
                onBlur={(e) => handleObjectiveBlur(e.target.value)}
              />

              <select
                className="border text-sm rounded px-2 py-1 w-40"
                defaultValue={type}
                onBlur={(e) =>
                  handleTypeBlur(e.target.value as 'strategic' | 'tactical' | 'operational')
                }
              >
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
