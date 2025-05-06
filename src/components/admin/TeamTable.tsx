import React from 'react';
import { UserPlus2 } from 'lucide-react';
import { TeamCard } from './TeamCard';
import { useTeams } from '../../hooks/useTeams';
import { useModalStore } from '../../stores/modalStore';
import { TeamFormModal } from './TeamFormModal';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  description: string;
  leaderName: string;
  leaderId: string;
  members: { id: string; name: string }[];
}
interface TeamTableProps {
  teams: Team[];
  loading?: boolean;
  onTeamUpdated?: () => void;
}

export function TeamTable({ teams, loading, onTeamUpdated }: TeamTableProps) {
  const { deleteTeam, updateTeam, createTeam, refetch, setTeams } = useTeams();
  const [editingTeam, setEditingTeam] = React.useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [teamForAddMember, setTeamForAddMember] = React.useState<Team | null>(null);
  const { showModal } = useModalStore();

  const handleDelete = (team: Team) => {
    showModal({
      type: 'danger',
      title: 'Excluir time',
      message: `Tem certeza que deseja excluir o time "${team.name}"? Essa ação não poderá ser desfeita.`,
      onConfirm: async () => {
        try {
          await deleteTeam(team.id);
          const updated = await refetch();
          setTeams(updated);
          toast.success('Time excluído com sucesso');
          onTeamUpdated?.();
        } catch (err) {
          console.error('[❌ Erro ao excluir time]', err);
          toast.error('Erro ao excluir time');
        }
      },
    });
  };

  const handleCreateClick = () => {
    setEditingTeam(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (team: Team) => {
    setEditingTeam({
      ...team,
      leader: team.leaderId,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-10">
      {loading ? (
        <div className="p-6 text-gray-500 text-sm">Carregando times...</div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-4 py-24 h-[40vh]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Nenhum time criado</h1>
          <p className="text-gray-500 text-sm mb-6">
            Nenhum time foi cadastrado ainda. Clique e crie o primeiro time da organização.
          </p>
          <button
            onClick={handleCreateClick}
            className="flex items-center text-sm justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus2 className="w-4 h-4 mr-2" />
            Criar novo time
          </button>
        </div>
      ) : (
        <>
          <div className="w-full mb-4">
            <button
              onClick={handleCreateClick}
              className="flex items-center text-sm justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus2 className="w-4 h-4 mr-2" />
              Novo Time
            </button>
          </div>

          <div className="w-full space-y-2">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                name={team.name}
                description={team.description}
                leader={team.leaderName}
                members={team.members} // ✅ agora com dados reais
                onManage={() => handleEditClick(team)}
                onAddMember={() => setTeamForAddMember(team)}
                onDelete={() => handleDelete(team)}
              />
            ))}
          </div>
        </>
      )}

      <TeamFormModal
        isOpen={isModalOpen}
        team={isEditMode ? editingTeam ?? undefined : undefined}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeam(null);
        }}
        onSave={async (data) => {
          try {
            if (isEditMode && data.id) {
              await updateTeam(data.id, data);
              toast.success('Time atualizado com sucesso');
            } else {
              await createTeam(data);
              toast.success('Time criado com sucesso');
            }

            const updated = await refetch();
            setTeams(updated);
            onTeamUpdated?.();
          } catch (error) {
            console.error('[❌ Erro ao salvar time]', error);
            toast.error('Erro ao salvar time');
          } finally {
            setIsModalOpen(false);
            setEditingTeam(null);
          }
        }}
      />

      {teamForAddMember && (
        <AddTeamMemberModal
          isOpen={!!teamForAddMember}
          teamId={teamForAddMember.id}
          teamLeaderId={teamForAddMember.leaderId} // ✅ passa o ID do líder
          onClose={() => setTeamForAddMember(null)}
          onMemberAdded={async () => {
            const updated = await refetch();
            onTeamUpdated?.();
            toast.success('Membro adicionado ao time');
          }}
        />
      )}
    </div>
  );
}
