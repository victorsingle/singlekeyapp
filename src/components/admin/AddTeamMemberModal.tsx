import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamLeaderId: string;
  onMemberAdded: () => void;
}

export function AddTeamMemberModal({
  isOpen,
  onClose,
  teamId,
  teamLeaderId,
  onMemberAdded,
}: AddTeamMemberModalProps) {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsersAndMembers = async () => {
      const [usersRes, membersRes] = await Promise.all([
        supabase.from('invited_users').select('id, first_name, last_name'),
        supabase.from('team_members').select('user_id').eq('team_id', teamId),
      ]);

      if (usersRes.error || membersRes.error) {
        console.error('[❌ Erro ao carregar usuários/membros]', usersRes.error || membersRes.error);
        return;
      }

      const all = usersRes.data?.filter((u) => u.id !== teamLeaderId) || [];
      const currentIds = new Set((membersRes.data ?? []).map((m) => m.user_id));
      const selected = all.filter((u) => currentIds.has(u.id));

      setAllUsers(all);
      setSelectedUsers(selected);
    };

    fetchUsersAndMembers();
    setSearchTerm('');
  }, [isOpen, teamId, teamLeaderId]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers([]);
      return;
    }

    const lower = searchTerm.toLowerCase();
    setFilteredUsers(
      allUsers
        .filter(
          (u) =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(lower) &&
            !selectedUsers.find((sel) => sel.id === u.id)
        )
    );
  }, [searchTerm, allUsers, selectedUsers]);

  const handleSelectUser = (user: any) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchTerm('');
  };

  const handleRemoveUser = (id: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSave = async () => {
    const { data: currentMembers, error } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    if (error) {
      console.error('[❌ Erro ao buscar membros atuais]', error);
      return;
    }

    const currentIds = new Set((currentMembers ?? []).map((m) => m.user_id));
    const selectedIds = new Set(selectedUsers.map((u) => u.id));

    const toRemove = [...currentIds].filter((id) => !selectedIds.has(id));
    const toAdd = [...selectedIds].filter((id) => !currentIds.has(id));

    try {
      await Promise.all([
        ...toRemove.map((id) =>
          supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', id)
        ),
        ...toAdd.map((id) =>
          supabase.from('team_members').insert({ team_id: teamId, user_id: id, role: 'member' })
        ),
      ]);

      await onMemberAdded();
      onClose();
    } catch (e) {
      console.error('[❌ Erro ao salvar membros]', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Adicionar membros</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
              >
                {user.first_name} {user.last_name}
                <button
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => handleRemoveUser(user.id)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Digite para buscar usuários..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
           {searchTerm && (
              filteredUsers.length > 0 ? (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto mt-1 w-full">
                  {filteredUsers.map((user) => (
                    <li
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                    >
                      {user.first_name} {user.last_name}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow px-4 py-2 text-sm text-gray-500">
                  Usuário não encontrado
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="text-sm text-gray-600">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
