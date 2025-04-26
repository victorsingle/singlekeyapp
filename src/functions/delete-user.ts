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
    // 1. Buscar o user_id do convite
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

    // 2. Se tiver user_id, deletar no Supabase Auth
    if (authUserId) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (deleteAuthError) {
        console.error('[❌ Erro ao deletar no Auth]:', deleteAuthError);
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Erro ao deletar usuário no Auth' }),
        };
      }
    }

    // 3. Deletar o convite da tabela invited_users
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

    console.log('[✅ Usuário e convite excluídos com sucesso]');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário convidado excluído com sucesso' }),
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
