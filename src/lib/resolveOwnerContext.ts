// src/lib/resolveOwnerContext.ts
import { supabase } from "./supabase";

export interface OwnerContext {
  ownerId: string;
  organizationId: string | null;
  role: string;
}

export async function resolveOwnerContext(): Promise<OwnerContext | null> {
  try {
    // Pegar usuário atual autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Usuário não autenticado:', userError);
      return null;
    }

    const authUserId = user.id;

    // Buscar o perfil do usuário na tabela users
    const { data: userProfile, error: userProfileError } = await supabase
      .from('users')
      .select('id, user_id, role')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (userProfileError || !userProfile) {
      console.error('Usuário não encontrado na tabela users', userProfileError);
      return null;
    }

    const ownerId = userProfile.id;

    // Buscar a conta relacionada usando authUserId
    const { data: accountDataFromAuth, error: accountErrorFromAuth } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_user_id', authUserId)
      .maybeSingle();

    if (accountErrorFromAuth) {
      console.error('Erro ao buscar organização:', accountErrorFromAuth);
      return null;
    }

    const organizationId = accountDataFromAuth?.id ?? null;

    return {
      ownerId,
      organizationId,
      role: userProfile.role,
    };
  } catch (error) {
    console.error('Erro inesperado ao resolver contexto do owner:', error);
    return null;
  }
}