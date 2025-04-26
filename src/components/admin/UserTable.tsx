import React, { useState } from 'react';
import { UserPlus2, Users } from 'lucide-react';
import { AppUser } from '../../../hooks/useUsers';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useModalStore } from '../../stores/modalStore';

interface UserTableProps {
  users: AppUser[];
  loading?: boolean;
  onInviteClick?: () => void;
  onUserUpdated?: () => void;
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
}

export function UserTable({ users, loading, onInviteClick, onUserUpdated, setUsers }: UserTableProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const { showModal } = useModalStore();

  const handleFieldChange = (id: string, field: string, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleBlur = async (id: string) => {
    const updates = editedData[id];
    if (!updates || !id) {
      toast.error('Dados inválidos para atualização.');
      return;
    }
  
    const originalUser = users.find((u) => u.id === id);
    if (!originalUser) {
      toast.error('Usuário original não encontrado.');
      return;
    }
  
    const mergedUpdates = {
      first_name: updates.first_name ?? originalUser.first_name,
      last_name: updates.last_name ?? originalUser.last_name,
      role: updates.role ?? originalUser.role,
    };
  
    // Atualizando na tabela 'invited_users'
    const { error } = await supabase.from('invited_users').update(mergedUpdates).eq('id', id);
  
    if (error) {
      toast.error('Erro ao atualizar usuário');
      console.error('[❌ Supabase Update Error]', error);
      return;
    }
  
    toast.success('Usuário atualizado');
  
    // Atualiza localmente o usuário editado, antes do refetch
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, ...mergedUpdates }
          : u
      )
    );
  
    // Recarrega do backend para manter sincronizado
    onUserUpdated?.();
  
    // Limpa estado de edição
    setEditingUserId(null);
    setEditedData((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };
  
  const handleDelete = (user: AppUser) => {
    showModal({
      type: 'danger',
      title: 'Excluir usuário',
      message: 'Tem certeza que deseja excluir este usuário? Esta ação não poderá ser desfeita.',
      onConfirm: async () => {
        try {
          const response = await fetch('/.netlify/functions/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inviteId: user.id,      // ID do registro invited_users
              userId: user.user_id,   // UID do auth.users
            }),
          });
  
          const result = await response.json();
  
          if (!response.ok) {
            toast.error(result.message || 'Erro ao excluir usuário');
            console.error('[❌ Delete Error]', result);
            return;
          }
  
          toast.success('Usuário removido com sucesso');
          onUserUpdated?.();
        } catch (err) {
          console.error('[❌ Handler Error]', err);
          toast.error('Erro inesperado ao excluir');
        }
      },
    });
  };
  
  
  
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-800">Usuários</h2>
          </div>
          <button
            onClick={onInviteClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus2 className="w-4 h-4" />
            Convidar Usuário
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-gray-500 text-sm">Carregando usuários...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  Nenhum usuário foi convidado ainda.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editedData[user.id]?.first_name ?? user.first_name ?? ''}
                          onChange={(e) => handleFieldChange(user.id, 'first_name', e.target.value)}
                          onBlur={() => handleBlur(user.id)}
                          placeholder="Nome"
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                        />
                        <input
                          value={editedData[user.id]?.last_name ?? user.last_name ?? ''}
                          onChange={(e) => handleFieldChange(user.id, 'last_name', e.target.value)}
                          onBlur={() => handleBlur(user.id)}
                          placeholder="Sobrenome"
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      </div>
                    ) : (
                      <div
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                        onClick={() => setEditingUserId(user.id)}
                      >
                        {user.first_name} {user.last_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.id ? (
                      <select
                        value={editedData[user.id]?.role ?? user.role}
                        onChange={(e) => handleFieldChange(user.id, 'role', e.target.value)}
                        onBlur={() => handleBlur(user.id)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="admin">Administrador</option>
                        <option value="champion">Champion</option>
                        <option value="collaborator">Colaborador</option>
                      </select>
                    ) : (
                      <span
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize cursor-pointer"
                        onClick={() => setEditingUserId(user.id)}
                      >
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">–</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(user.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
