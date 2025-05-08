import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { supabase } from '../../lib/supabase';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: { id?: string; name: string; description: string; leader: string }) => void;
  team?: {
    id: string;
    name: string;
    description: string;
    leader: string;
  };
}

export function TeamFormModal({ isOpen, onClose, onSave, team }: TeamFormModalProps) {
  const { users } = useUsers();
  const activeUsers = users.filter((u) => u.status === 'active');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leader, setLeader] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const filtered = activeUsers.filter((u) =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(leaderName.toLowerCase()) &&
    !excludedIds.has(u.id)
  );

  useEffect(() => {
    const fetchExcludedUsers = async () => {
      const [leadersRes, membersRes] = await Promise.all([
        supabase.from('teams').select('leader_id'),
        supabase.from('team_members').select('user_id'),
      ]);
  
      const leaderIds = new Set((leadersRes.data ?? []).map((t) => t.leader_id));
      const memberIds = new Set((membersRes.data ?? []).map((m) => m.user_id));
  
      // Se estiver editando, mantém o líder atual
      if (team?.leader) {
        leaderIds.delete(team.leader);
      }
  
      setExcludedIds(new Set([...leaderIds, ...memberIds]));
    };
  
    if (isOpen) {
      fetchExcludedUsers();
    }
  }, [isOpen, team]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name || !description || !leader) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    onSave?.({
      id: team?.id,
      name,
      description,
      leader,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {team ? 'Editar Time' : 'Novo Time'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Time</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Time de Produto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o propósito do time..."
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Líder do Time</label>
            <input
              type="text"
              value={leaderName}
              onChange={(e) => {
                const val = e.target.value;
                setLeaderName(val);
                setShowSuggestions(true);

                const match = activeUsers.find(
                  (u) =>
                    `${u.first_name} ${u.last_name}`.toLowerCase() === val.toLowerCase()
                );
                if (match) setLeader(match.id);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Digite para buscar um líder"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
           
           {showSuggestions && (
              filtered.length > 0 ? (
                <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-auto z-10">
                  {filtered.map((u) => (
                    <li
                      key={u.id}
                      onClick={() => {
                        setLeader(u.id);
                        setLeaderName(`${u.first_name} ${u.last_name}`);
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                    >
                      {u.first_name} {u.last_name}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-4 py-2 text-sm text-gray-500 z-10">
                  Usuário não encontrado
                </div>
              )
            )}

          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            {team ? 'Salvar Alterações' : 'Criar Time'}
          </button>
        </div>
      </div>
    </div>
  );
}
