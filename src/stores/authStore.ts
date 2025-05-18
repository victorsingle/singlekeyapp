import { create } from 'zustand';
import { devtools } from 'zustand/middleware'; 
import { supabase } from '../lib/supabase';
import { keysToCamel } from '../utils/case'; 

interface AuthState {
  userId: string | null;
  role: 'admin' | 'champion' | 'collaborator' | null;
  firstName: string | null;
  lastName: string | null; // ✅ Adicione isso
  adminId: string | null;
  companyName: string | null;
  organizationId: string | null; // <<< ADICIONAR AQUI!
  loading: boolean;
  error: string | null;
  roleInOrg: string | null;
  wantsUpdates: boolean;

  fetchUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    userId: null,
    role: null,
    firstName: null,
    lastName: null,
    adminId: null,
    companyName: null,
    organizationId: null, 
    loading: false,
    error: null,
    roleInOrg: null,
    wantsUpdates: false,

    fetchUserData: async () => {
      set({ loading: true });
    
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.user?.id) {
          throw sessionError || new Error('Usuário não autenticado.');
        }
    
        const userId = sessionData.session.user.id;
    
        console.log('[📦] user_id obtido da sessão:', userId);
    
        // Primeiro tenta buscar no invited_users
        const { data: invitedUserRaw } = await supabase
          .from('invited_users')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
    
        if (invitedUserRaw) {
          const invitedUser = keysToCamel(invitedUserRaw); // 🛠️ Converte aqui!
    
          // busca nome da organização na view já existente
          const { data: invitedOrg } = await supabase
          .from('invited_users_with_org')
          .select('organization_name')
          .eq('user_id', userId)
          .maybeSingle();

          set({
          userId,
          firstName: invitedUser.firstName,
          lastName: invitedUser.lastName,
          role: invitedUser.role,
          adminId: invitedUser.invitedBy,
          companyName: invitedOrg?.organization_name ?? null,
          organizationId: invitedUser.organizationId,
          loading: false,
          error: null,
          roleInOrg: invitedUser.roleInOrg ?? null,
          wantsUpdates: invitedUser.wantsUpdates ?? false,
          });

        } else {
          const { data: userProfileRaw } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
    
          if (userProfileRaw) {
            const userProfile = keysToCamel(userProfileRaw); // 🛠️ Converte aqui também!
    
            set({
              userId,
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              role: 'admin',
              adminId: null,
              companyName: userProfile.companyName,
              organizationId: userProfile.organizationId, // camelCase funcionando!
              loading: false,
              error: null,
            });

            console.log('[✅ fetchUserData] organizationId salvo:', userProfile.organizationId);

            setTimeout(() => {
              console.log('[🧪 organizationId no store após 2s]', useAuthStore.getState().organizationId);
            }, 2000);

            
          } else {
            throw new Error('Usuário não encontrado nas tabelas de perfil.');
          }
        }
      } catch (error: any) {
        console.error('[❌ useAuthStore] Erro ao buscar dados do usuário:', error);
        set({ error: error.message, loading: false });
      }
    }

  }), { name: 'AuthStore' })
);
