import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SubHeader } from '../../components/SubHeader';
import { supabase } from '../../lib/supabase';
import { TeamMemberTable } from '../../components/admin/TeamMemberTable';
import { AddTeamMemberModal } from '../../components/admin/AddTeamMemberModal';
import { Plus } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  leader_id: string;
}

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchTeamAndMembers = async () => {
      setLoading(true);

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (teamError) {
        console.error('Erro ao buscar time:', teamError);
        return;
      }

      setTeam(teamData);
      await fetchMembers();
      setLoading(false);
    };

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, role')
        .eq('team_id', id);

      if (error) {
        console.error('Erro ao buscar membros:', error);
      } else {
        setMembers(data || []);
      }
    };

    fetchTeamAndMembers();
  }, [id]);

  return (
    <>
      <SubHeader
        title={team?.name || 'Time'}
        breadcrumb={[
          { label: 'Administração', href: '/admin/teams' },
          { label: 'Times', href: '/admin/teams' },
          { label: team?.name || 'Detalhes', active: true },
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Membros do Time</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Adicionar Membro
          </button>
        </div>

        <TeamMemberTable members={members} loading={loading} />
      </div>

      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        teamId={id!}
        onMemberAdded={async () => {
          const { data } = await supabase
            .from('team_members')
            .select('id, user_id, role')
            .eq('team_id', id);
          setMembers(data || []);
        }}
      />
    </>
  );
}
