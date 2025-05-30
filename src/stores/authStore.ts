import { create } from 'zustand';
import { devtools } from 'zustand/middleware'; 
import { supabase } from '../lib/supabase';
import { keysToCamel } from '../utils/case'; 

interface AuthState {
  userId: string | null;
  role: 'admin' | 'champion' | 'collaborator' | null;
  firstName: string | null;
  lastName: string | null;
  adminId: string | null;
  companyName: string | null;
  organizationId: string | null;
  loading: boolean;
  error: string | null;
  roleInOrg: string | null;
  wantsUpdates: boolean;
  onboardingCompleted: boolean;

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
    onboardingCompleted: false,

    fetchUserData: async () => {
      set({ loading: true });
    
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.user?.id) {
          throw sessionError || new Error('Usuário não autenticado.');
        }

        const userId = sessionData.session.user.id;

        const { data: invitedUserRaw } = await supabase
          .from('invited_users')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (invitedUserRaw) {
          const invitedUser = keysToCamel(invitedUserRaw);

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
            onboardingCompleted: false, // convidados não usam onboarding
          });

        } else {
          const { data: userProfileRaw } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (userProfileRaw) {
            const userProfile = {
              ...keysToCamel(userProfileRaw),
              onboardingCompleted: userProfileRaw.onboarding_completed, // 👈 força corretamente
            };

            set({
              userId,
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              role: 'admin',
              adminId: null,
              companyName: userProfile.companyName,
              organizationId: userProfile.organizationId,
              loading: false,
              error: null,
              roleInOrg: null,
              wantsUpdates: userProfile.wantsUpdates ?? false,
              onboardingCompleted: userProfile.onboardingCompleted ?? false,
            });

            setTimeout(() => {
              // console.log('[🧪 organizationId no store após 2s]', useAuthStore.getState().organizationId);
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
