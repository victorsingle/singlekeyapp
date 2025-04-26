import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Método não permitido' }),
    };
  }

  const { inviteId } = JSON.parse(event.body || '{}');

  if (!inviteId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'ID do convite não fornecido' }),
    };
  }

  console.log('[🚀 Iniciando exclusão do convite ID]:', inviteId);

  try {
    // 1. Buscar o registro do convite
    const { data: invitedUser, error: fetchError } = await supabaseAdmin
      .from('invited_users')
      .select('user_id')
      .eq('id', inviteId)
      .single();

    if (fetchError || !invitedUser) {
      console.error('[❌ Erro ao buscar convite]:', fetchError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Convite não encontrado' }),
      };
    }

    const authUserId = invitedUser.user_id;

    if (authUserId) {
      console.log('[🔍 Tentando forçar revogação de sessão do usuário]:', authUserId);

      // 2. Tenta revogar a sessão (não é obrigatório, mas ajuda a evitar erros 500)
      const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(authUserId);

      if (revokeError) {
        console.warn('[⚠️ Erro ao tentar revogar sessão (seguindo mesmo assim)]:', revokeError);
      } else {
        console.log('[✅ Sessão revogada com sucesso]');
      }

      // 3. Agora tenta deletar o usuário
      console.log('[🔍 Tentando deletar usuário no Auth]:', authUserId);

      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);

      if (deleteAuthError) {
        console.error('[❌ Erro ao deletar usuário no Auth]:', deleteAuthError);
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Erro ao deletar usuário no Auth' }),
        };
      }

      console.log('[✅ Usuário do Auth deletado com sucesso]');
    } else {
      console.log('[ℹ️ Nenhum user_id registrado no convite, pulando deleção no Auth]');
    }

    // 4. Deletar o registro do convite
    const { error: deleteInviteError } = await supabaseAdmin
      .from('invited_users')
      .delete()
      .eq('id', inviteId);

    if (deleteInviteError) {
      console.error('[❌ Erro ao deletar convite]:', deleteInviteError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao excluir convite' }),
      };
    }

    console.log('[✅ Convite deletado com sucesso]');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário convidado e convite excluídos com sucesso' }),
    };
  } catch (err) {
    console.error('[❌ Erro inesperado na exclusão]:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado ao excluir convite' }),
    };
  }
};

export { handler };
