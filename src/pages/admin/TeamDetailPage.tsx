import React from 'react';
import { useParams } from 'react-router-dom';
import { TeamMemberTable } from '../../components/admin/TeamMemberTable';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Time não encontrado</div>;
  }

  return (
    <div className="p-6">
      <TeamMemberTable teamId={id} />
    </div>
  );
}