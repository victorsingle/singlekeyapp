import React, { useState, useEffect } from 'react';
import { SubHeader } from '../../components/SubHeader';
import { TeamTable } from '../../components/admin/TeamTable';
import { TeamFormModal } from '../../components/admin/TeamFormModal';
import { useTeams } from '../../hooks/useTeams';
import { ModalContainer } from '../../components/ModalContainer';
import { useAuthStore } from '../../stores/authStore';

export function TeamsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchUserData } = useAuthStore();
  const {
    teams,
    loading,
    fetchTeams,
    refetch,
    setTeams,
    createTeam,
  } = useTeams();

  useEffect(() => {
    const ensureUserData = async () => {
      const { organizationId } = useAuthStore.getState();

      if (!organizationId) {
        await useAuthStore.getState().fetchUserData();
      }

      const updatedOrgId = useAuthStore.getState().organizationId;
      if (updatedOrgId) {
        const loadedTeams = await fetchTeams();
        setTeams(loadedTeams);
      } else {
        console.warn('[⚠️ TeamsPage] organizationId ainda ausente após fetch');
      }
    };

    ensureUserData();
  }, []);

  const handleCreate = async (data: { name: string; description: string; leader: string }) => {
    await createTeam(data.name, data.description, data.leader);
    const updated = await refetch();
    setTeams(updated);
  };

  return (
    <>
      <SubHeader
        title="Times"
        breadcrumb={[
          { label: 'Administração', href: '/admin/teams' },
          { label: 'Times', active: true },
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto">
        <TeamTable
          teams={teams}
          loading={loading}
          onCreateClick={() => setIsModalOpen(true)}
          onTeamUpdated={async () => {
            const updated = await refetch();
            setTeams(updated);
          }}
        />
        <TeamFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreate}
        />
        <ModalContainer />
      </div>
    </>
  );
}
