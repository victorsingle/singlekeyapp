// src/lib/resolveOwnerContext.ts
import { supabase } from "../lib/supabase";

export interface OwnerContext {
  ownerId: string;
  organizationId: string | null;
  role: string;
}

export async function resolveOwnerContext(): Promise<OwnerContext | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Usuário não autenticado:', userError);
      return null;
    }

    const authUserId = user.id;

    // 1️⃣ Primeiro tenta buscar em users
    let { data: userProfile, error: userProfileError } = await supabase
      .from('users')
      .select('id, user_id, role')
      .eq('user_id', authUserId)
      .maybeSingle();

    // 2️⃣ Se não achou no users, tenta no invited_users
    if (!userProfile) {
      const { data: invitedProfile, error: invitedError } = await supabase
        .from('invited_users')
        .select('id, user_id, role')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (invitedError) {
        console.error('Erro ao buscar no invited_users:', invitedError);
        return null;
      }

      if (invitedProfile) {
        userProfile = invitedProfile;
      } else {
        console.error('Usuário não encontrado nem em users nem em invited_users');
        return null;
      }
    }

    const ownerId = userProfile.id;

    // 3️⃣ Tenta buscar como OWNER (accounts)
    const { data: accountDataFromAuth, error: accountErrorFromAuth } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_user_id', authUserId)
      .maybeSingle();

    if (accountErrorFromAuth) {
      console.error('Erro ao buscar organização como owner:', accountErrorFromAuth);
      return null;
    }

    if (accountDataFromAuth) {
      return {
        ownerId,
        organizationId: accountDataFromAuth.id,
        role: userProfile.role,
      };
    }

    // 4️⃣ Se não achou como owner, busca como membro (organization_users)
    const { data: memberAssociation, error: memberError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (memberError) {
      console.error('Erro ao buscar organização como membro:', memberError);
      return null;
    }

    if (memberAssociation) {
      return {
        ownerId,
        organizationId: memberAssociation.organization_id,
        role: userProfile.role,
      };
    }

    console.error('Nenhuma organização encontrada para o usuário.');
    return null;
  } catch (error) {
    console.error('Erro inesperado ao resolver contexto:', error);
    return null;
  }
}
