import { create } from 'zustand';
import { devtools } from 'zustand/middleware'; 
import { supabase } from '../lib/supabase';

interface AuthState {
  userId: string | null;
  role: 'admin' | 'champion' | 'collaborator' | null;
  firstName: string | null;
  adminId: string | null;
  companyName: string | null;
  loading: boolean;
  error: string | null;

  fetchUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    devtools((set) => ({
  userId: null,
  role: null,
  firstName: null,
  adminId: null,
  companyName: null,
  loading: false,
  error: null,

  fetchUserData: async () => {
    set({ loading: true });

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user?.id) {
        throw sessionError || new Error('Usuário não autenticado.');
      }

      const userId = sessionData.session.user.id;

      // Primeiro tenta buscar no invited_users
      const { data: invitedUser } = await supabase
        .from('invited_users')
        .select('first_name, role, invited_by')
        .eq('user_id', userId)
        .maybeSingle();

        console.log('[🔎 invitedUser encontrado?]', invitedUser);

      if (invitedUser) {
        set({
          userId,
          firstName: invitedUser.first_name,
          role: invitedUser.role,
          adminId: invitedUser.invited_by,
          companyName: null,
          loading: false,
          error: null,
        });
      } else {
        // Se não for convidado, busca no users
        const { data: userProfile } = await supabase
          .from('users')
          .select('first_name, company_name')
          .eq('user_id', userId)
          .maybeSingle();

        if (userProfile) {
          set({
            userId,
            firstName: userProfile.first_name,
            role: 'admin',
            adminId: null,
            companyName: userProfile.company_name,
            loading: false,
            error: null,
          });

          console.log('[✅ authStore preenchida como ADMIN]', {
            userId,
            role: 'admin',
            firstName: userProfile.first_name,
            companyName: userProfile.company_name,
          });

          

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
