import React from 'react';
import { Crown, UserMinus, UserPlus } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  isLeader: boolean;
  joinedAt?: string;
}

export function TeamMemberTable({
  members = [],
  onAddClick,
}: {
  members: TeamMember[];
  onAddClick?: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      <div className="p-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Membros do Time</h2>
        <button
          type="button"
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Membro
        </button>
      </div>

      <div className="flex flex-col">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 hover:bg-gray-50"
          >
            {/* Coluna: Informações do Membro */}
            <div className="flex items-center min-w-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-4 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{member.name}</div>
                <div className="text-sm text-gray-500 truncate">{member.email}</div>
              </div>
            </div>

            {/* Coluna: Papel */}
            <div className="flex items-center gap-2">
              {member.isLeader && <Crown className="w-4 h-4 text-yellow-500" />}
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                member.isLeader ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {member.isLeader ? 'Líder' : 'Membro'}
              </span>
            </div>

            {/* Coluna: Data */}
            <div className="text-sm text-gray-500">
              {member.joinedAt || '—'}
            </div>

            {/* Coluna: Ações */}
            <div className="flex gap-3 ml-auto">
              {!member.isLeader && (
                <button
                  type="button"
                  className="text-yellow-600 hover:text-yellow-800"
                  title="Tornar Líder"
                >
                  <Crown className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                className="text-red-600 hover:text-red-800"
                title="Remover do Time"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
