import React from 'react';
import { MoreHorizontal, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';


// ==============================
// Componente OKRCardEditable
// ==============================
interface OKRCardEditableProps {
  okr: {
    id: string;
    objective: string;
    type: 'strategic' | 'tactical' | 'operational';
    status: string;
  };
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { objective: string; type: string }) => void;
}

export function OKRCardEditable({ okr, expanded, onToggleExpand, onDelete, onUpdate }: OKRCardEditableProps) {
  const prefix = {
    strategic: '★',
    tactical: '↳',
    operational: '↳↳',
  }[okr.type];

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim();
    if (newValue !== okr.objective) {
      onUpdate(okr.id, { objective: newValue, type: okr.type });
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(okr.id, { type: e.target.value, objective: okr.objective });
  };

  return (
    <div className="relative bg-white border rounded-lg shadow-sm p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="w-full space-y-2">
          <label className="text-xs font-medium text-gray-500">Objetivo</label>
          <div className="flex items-start gap-2">
            <span className="pt-2 text-gray-400">{prefix}</span>
            <input
              defaultValue={okr.objective}
              onBlur={handleBlur}
              className="w-full border rounded px-3 py-2 text-sm text-gray-700"
              placeholder="Digite o objetivo..."
            />
          </div>

          <label className="text-xs font-medium text-gray-500">Tipo</label>
          <select
            value={okr.type}
            onChange={handleTypeChange}
            className="w-full mt-1 border rounded px-3 py-2 text-sm"
          >
            <option value="strategic">Estratégico</option>
            <option value="tactical">Tático</option>
            <option value="operational">Operacional</option>
          </select>
        </div>

        <div className="flex gap-2 ml-2">
          <button onClick={() => onToggleExpand(okr.id)} title={expanded ? 'Ocultar KRs' : 'Ver KRs'}>
            {/* Substitua pelos seus ícones corretos */}
            <span className="text-blue-600 text-sm">{expanded ? '−' : '+'}</span>
          </button>

          <DropdownMenu
            trigger={
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            }
          >
            <DropdownMenuItem onClick={() => onDelete(okr.id)} className="text-red-500">Excluir</DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500 italic">[Key Results expandido aqui]</div>
        </div>
      )}
    </div>
  );
}

// ==============================
// Componente CycleCard
// ==============================
interface CycleCardProps {
  title: string;
  status: 'draft' | 'active' | 'completed';
  strategicTheme: string;
  period: string;
}

function CycleCard({ title, status, strategicTheme, period }: CycleCardProps) {
  const borderColor = {
    draft: 'border-l-blue-400',
    active: 'border-l-yellow-400',
    completed: 'border-l-green-500',
  }[status];

  const badgeColor = {
    draft: 'bg-blue-100 text-blue-800',
    active: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  }[status];

  return (
    <div className={`relative border-l-4 ${borderColor} bg-white rounded-lg p-4 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-800">{title}</h4>
            <span className={`text-xs mr-3 px-2 py-0.5 rounded-full ${badgeColor}`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{strategicTheme}</p>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{period}</span>
          </div>
        </div>

        <DropdownMenu
          trigger={
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          }
        >
          <DropdownMenuItem>Visualizar</DropdownMenuItem>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
        </DropdownMenu>
      </div>
    </div>
  );
}

function CycleCardExampleGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CycleCard title="Ciclo Q1 2025" status="draft" strategicTheme="Eficiência Operacional" period="01/01/2025 - 31/03/2025" />
      <CycleCard title="Ciclo Q2 2025" status="active" strategicTheme="Crescimento Global" period="01/04/2025 - 30/06/2025" />
      <CycleCard title="Ciclo Q4 2024" status="completed" strategicTheme="Transformação Digital" period="01/10/2024 - 31/12/2024" />
    </div>
  );
}

// ==============================
// Componente UserCard
// ==============================
function UserCard({ name, email, role, team, status }: {
  name: string;
  email: string;
  role: string;
  team: string;
  status: 'ativo' | 'inativo';
}) {
  const statusColor = status === 'ativo'
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-500';

  return (
    <div className="relative bg-white rounded-md p-4 shadow-sm border">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{email}</p>
          <div className="flex gap-2 text-sm text-gray-600">
            <span>{role}</span>
            <span className="text-gray-400">|</span>
            <span>{team}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
            {status}
          </span>
          <DropdownMenu
            trigger={
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            }
          >
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Desativar</DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function UserCardExampleList() {
  return (
    <div className="space-y-2">
      <UserCard name="João Silva" email="joao@email.com" role="Gestor" team="Produto" status="ativo" />
    </div>
  );
}

// ==============================
// Componente TeamCard
// ==============================
function TeamCard({ name, members, leader }: {
  name: string;
  members: string[];
  leader: string;
}) {
  return (
    <div className="relative bg-white rounded-md p-4 shadow-sm border flex justify-between items-center">
      <div>
        <h4 className="text-base font-semibold text-gray-800">{name}</h4>
        <div className="text-sm text-gray-500 mt-1">
          {members.length} membros <span className="mx-2 text-gray-300">|</span> Líder: {leader}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((initials, idx) => (
            <div key={idx} className="w-7 h-7 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center justify-center border border-white">
              {initials}
            </div>
          ))}
        </div>
        <DropdownMenu
          trigger={
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          }
        >
          <DropdownMenuItem>Gerenciar</DropdownMenuItem>
          <DropdownMenuItem>Adicionar Membro</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Excluir Time</DropdownMenuItem>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TeamCardExampleGrid() {
  return (
    <div className="space-y-2">
      <TeamCard name="Time de Produto" leader="João Silva" members={["JS", "AM", "LC", "RT"]} />
    </div>
  );
}

// ==============================
// Exportador Principal
// ==============================
export function CardExamples() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Ciclos com Status</h3>
        <CycleCardExampleGrid />
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Usuários</h3>
        <UserCardExampleList />
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Times</h3>
        <TeamCardExampleGrid />
      </section>
    </div>
  );
}
