import { useAuthStore } from "../stores/authStore";

export function usePermissions() {
  const { role } = useAuthStore();

  if (!role) {
    return {
      isAdmin: false,
      isChampion: false,
      isCollaborator: false,
      canCreateCycle: false,
      canEditCycle: false,
      canDeleteCycle: false,
      canCreateOKR: false,
      canEditOKR: false,
      canDeleteOKR: false,
      canUpdateKRProgress: false,
      canManageUsers: false,
    };
  }

  const isAdmin = role === 'admin';
  const isChampion = role === 'champion';
  const isCollaborator = role === 'collaborator';

  return {
    isAdmin,
    isChampion,
    isCollaborator,

    canCreateCycle: isAdmin || isChampion,
    canEditCycle: isAdmin || isChampion,
    canDeleteCycle: isAdmin || isChampion,

    canCreateOKR: isAdmin || isChampion,
    canEditOKR: isAdmin || isChampion,
    canDeleteOKR: isAdmin || isChampion,

    canUpdateKRProgress: isAdmin || isChampion || isCollaborator,

    canManageUsers: isAdmin, // apenas admin
  };
}
