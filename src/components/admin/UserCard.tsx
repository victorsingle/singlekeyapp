import React from "react";
import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "../../components/DropdownMenu";
import clsx from "clsx";

export function UserCard({
    name,
    email,
    role,
    team,
    status,
    onEdit,
    onDelete,
  }: {
    name: string;
    email: string;
    role: string;
    team: string;
    status: 'ativo' | 'inativo';
    onEdit?: () => void;
    onDelete?: () => void;
  }) {
    const statusColor = status === 'ativo'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-500';
  
    return (
      <div className="relative bg-white rounded-md p-4 shadow-sm border mb-2">
        <div className="flex h-full justify-between items-center">
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-lg uppercase">
                    {name.charAt(0)}
                </div>

                {/* Informações do usuário */}
                <div className="space-y-0">
                  <p className="font-medium text-gray-900">{name}</p>
                  <p className="text-xs text-gray-500">{email}</p>
                  <div className="flex gap-2 text-xs text-gray-600">
                    <span>{role}</span>
                    <span className="text-gray-400">|</span>
                    <span>{team || 'Sem time'}</span>
                  </div>
                  <span className={`inline-block text-xs px-2 rounded-full ${statusColor}`}>
                    {status}
                  </span>
                </div>
            </div>
  
          <div className="flex items-center gap-2">
            <DropdownMenu
              trigger={
                <button className="text-gray-400 hover:text-gray-600 mt-2">
                  <MoreVertical className="w-5 h-5" />
                </button>
              }
            >
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }
  