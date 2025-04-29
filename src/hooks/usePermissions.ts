import { useAuthStore } from "../stores/authStore";

export function usePermissions() {
  const { userId, role } = useAuthStore(); // 🛠️ USA ROLE DIRETAMENTE
  // Proteção se ainda não carregou
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
    };
  }

  const isAdmin = role === 'admin';
  const isChampion = role === 'champion';
  const isCollaborator = role === 'collaborator';

  const canCreateCycle = isAdmin || isChampion;
  const canEditCycle = isAdmin || isChampion;
  const canDeleteCycle = isAdmin;

  const canCreateOKR = isAdmin || isChampion;
  const canEditOKR = isAdmin || isChampion;
  const canDeleteOKR = isAdmin;

  const canUpdateKRProgress = isAdmin || isChampion || isCollaborator;

  return {
    isAdmin,
    isChampion,
    isCollaborator,
    canCreateCycle,
    canEditCycle,
    canDeleteCycle,
    canCreateOKR,
    canEditOKR,
    canDeleteOKR,
    canUpdateKRProgress,
  };
}
