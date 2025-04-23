import React, { useState } from 'react';
import { TeamList } from '../../components/admin/TeamList';
import { TeamFormModal } from '../../components/admin/TeamFormModal';

export function TeamsPage() {
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  return (
    <div className="p-6">
      <TeamList />
      <TeamFormModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </div>
  );
}