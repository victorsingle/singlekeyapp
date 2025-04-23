import React, { useState } from 'react';
import { SubHeader } from '../../components/SubHeader';
import { UserTable } from '../../components/admin/UserTable';
import { InviteUserModal } from '../../components/admin/InviteUserModal';
import { useUsers } from '../../hooks/useUsers';
import { ModalContainer } from '../../components/ModalContainer';

export function UsersPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { users, loading, refetch, setUsers } = useUsers();

  return (
    <>
      <SubHeader
        title="Usuários"
        breadcrumb={[
          { label: 'Administração', href: '/admin/users' },
          { label: 'Usuários', active: true }
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto">
        <UserTable
          users={users}
          loading={loading}
          onInviteClick={() => setIsInviteModalOpen(true)}
          setUsers={setUsers} 
        />
        <InviteUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
        <ModalContainer />
      </div>
    </>
  );
}
