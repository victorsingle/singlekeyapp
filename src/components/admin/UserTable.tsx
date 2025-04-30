import React, { useState } from 'react';
import { UserPlus2, Users } from 'lucide-react';
import { AppUser } from '../../../hooks/useUsers';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useModalStore } from '../../stores/modalStore';
import { UserCard } from "./UserCard";

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
  
  const handleDelete = async (user: AppUser) => {
    console.log('[DEBUG] User recebido para exclusão:', user);
  
    const inviteId = user.id;
    const userId = user.user_id; // pode ser null, não tem problema agora!
  
    showModal({
      type: 'danger',
      title: 'Excluir usuário',
      message: 'Tem certeza que deseja excluir este usuário? Esta ação não poderá ser desfeita.',
      onConfirm: async () => {
        try {
          const response = await fetch('/.netlify/functions/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inviteId, userId }), // pode ser null mesmo
          });
  
          if (!response.ok) {
            toast.error('Erro ao excluir usuário');
            console.error('[❌ Delete Error]', await response.text());
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
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-10">
        <div>
          <button
            onClick={onInviteClick}
            className="w-full sm:w-auto flex items-center text-sm justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus2 className="w-4 h-4" />
            Convidar Usuário
          </button>
        </div>
        {loading ? (
    <div className="p-6 text-gray-500 text-sm">Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm text-center">Nenhum usuário foi convidado ainda.</div>
        ) : (
          <div className="w-full gap-4 py-4">
            {users.map((user) => (
              <UserCard
                key={user.id}
                name={`${user.first_name ?? ''} ${user.last_name ?? ''}`}
                email={user.email}
                role={user.role ?? '—'}
                team="—" // se ainda não estiver implementado
                status={user.status === 'active' ? 'ativo' : 'inativo'}
                onEdit={() => setEditingUserId(user.id)}
                onDelete={() => handleDelete(user)}
              />
            ))}
          </div>
        )}

      </div>
    </>
  );
}
