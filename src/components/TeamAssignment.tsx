import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface Team {
  id: string;
  name: string;
}

interface TeamAssignmentProps {
  krId: string;
}

export function TeamAssignment({ krId }: TeamAssignmentProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const organizationId = useAuthStore(state => state.organizationId);

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('team_key_results')
      .select('team_id, teams!inner(name)')
      .eq('key_result_id', krId);

    if (!error && data) {
      setTeams(data.map(d => ({ id: d.team_id, name: d.teams.name })));
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    await supabase
      .from('team_key_results')
      .delete()
      .eq('key_result_id', krId)
      .eq('team_id', teamId);
    setTeams(prev => prev.filter(t => t.id !== teamId));
  };

  const handleSave = async (selected: Team[]) => {
    const existingIds = teams.map(t => t.id);
    const selectedIds = selected.map(t => t.id);
  
    const toInsert = selected.filter(t => !existingIds.includes(t.id));
    const toRemove = teams.filter(t => !selectedIds.includes(t.id));
  
    if (toInsert.length > 0) {
      const inserts = toInsert.map(team => ({ key_result_id: krId, team_id: team.id }));
      await supabase.from('team_key_results').insert(inserts);
    }
  
    if (toRemove.length > 0) {
      const deleteIds = toRemove.map(t => t.id);
      await supabase
        .from('team_key_results')
        .delete()
        .in('team_id', deleteIds)
        .eq('key_result_id', krId);
    }
  
    setIsModalOpen(false);
    fetchTeams();
  };
  

  useEffect(() => {
    if (krId) fetchTeams();
  }, [krId]);

  return (
    <div className="mt-0">
      <label className="text-xs text-gray-500 block mb-2">Times Responsáveis</label>

      {teams.length === 0 ? (
        <div className="text-xs text-gray-400 bg-gray-100 border p-2 rounded">Adicione um time ou mais para este Key Result.</div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-2 bg-white border p-2 rounded">
          {teams.map((team) => (
            <span key={team.id} className="bg-blue-700 text-xs text-white rounded-full px-3 py-1 flex items-center">
              {team.name}
              <button onClick={() => handleRemoveTeam(team.id)} className="ml-2 text-white hover:text-blue-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
      data-guide="okrs-times"
        onClick={() => setIsModalOpen(true)}
        className="text-xs mt-2 mb-1 text-blue-600 hover:underline"
      >
        + Atribuir a um ou mais Times
      </button>

      {isModalOpen && (
        <AddTeamToKRModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          selected={teams}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}

interface AddTeamToKRModalProps {
  onClose: () => void;
  onSave: (teams: Team[]) => void;
  selected: Team[];
  organizationId?: string;
}

function AddTeamToKRModal({ onClose, onSave, selected, organizationId }: AddTeamToKRModalProps) {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<Team[]>(selected);

  useEffect(() => {
    const fetchAll = async () => {
      if (!organizationId) return;
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', organizationId);

      if (data) setAllTeams(data);
    };

    fetchAll();
  }, [organizationId]);

  const handleSelect = (team: Team) => {
    if (!selectedTeams.find(t => t.id === team.id)) {
      setSelectedTeams(prev => [...prev, team]);
    }
    setSearch('');
  };

  const handleRemove = (id: string) => {
    setSelectedTeams(prev => prev.filter(t => t.id !== id));
  };

  const filtered = search
    ? allTeams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !selectedTeams.find(st => st.id === t.id))
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Adicionar times ao KR</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {selectedTeams.map(team => (
              <div
                key={team.id}
                className="flex items-center bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
              >
                {team.name}
                <button
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => handleRemove(team.id)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Digite para buscar times..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              filtered.length > 0 ? (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto mt-1 w-full">
                  {filtered.map((team) => (
                    <li
                      key={team.id}
                      onClick={() => handleSelect(team)}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                    >
                      {team.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow px-4 py-2 text-sm text-gray-500">
                  Time não encontrado
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
            onClick={() => onSave(selectedTeams)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
