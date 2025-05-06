import React from 'react';
import { MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '../DropdownMenu';

interface TeamMember {
  id: string;
  name: string;
}

interface TeamCardProps {
  name: string;
  description?: string;
  members: TeamMember[];
  leader: string;
  onManage?: () => void;
  onAddMember?: () => void;
  onDelete?: () => void;
}

export function TeamCard({ name, description, members, leader, onManage, onAddMember, onDelete }: TeamCardProps) {
  return (
    <div className="relative bg-white rounded-md p-4 shadow-sm border flex justify-between items-center">
      <div>
        <h4 className="text-xl text-base font-semibold text-gray-800">{name}</h4>
        {description && <p className="text-xs text-gray-500 py-1">{description}</p>}
        <div className="text-xs text-gray-500 mt-1">
          <span className='font-semibold text-black'>{members.length}</span> membros <span className="mx-2">|</span> Líder: <span className='font-semibold text-black'>{leader}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((member) => {
            const initials = member?.name
              ? member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
              : '?';

            return (
              <div
                key={member.id}
                className="w-7 h-7 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center justify-center border border-white"
                title={member?.name || 'Desconhecido'}
              >
                {initials}
              </div>
            );
          })}
        </div>

        <DropdownMenu
          trigger={
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          }
        >
          <DropdownMenuItem onClick={onManage}>Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={onAddMember}>Gerenciar Membros</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            Excluir Time
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </div>
  );
}
