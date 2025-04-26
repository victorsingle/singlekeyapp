import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Método não permitido' }),
    };
  }

  const { inviteId, userId } = JSON.parse(event.body || '{}');

  if (!inviteId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'ID do convite não fornecido' }),
    };
  }

  console.log('[🚀 Iniciando exclusão do convite ID]:', inviteId);

  try {
    // 1. Deleta o registro do convite
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

    // 2. Marca o usuário como revogado na tabela `users`, se o userId for informado
    if (userId) {
      const { error: updateUserError } = await supabaseAdmin
        .from('users')
        .update({ status: 'revoked' })
        .eq('user_id', userId);

      if (updateUserError) {
        console.error('[❌ Erro ao atualizar usuário para revoked]:', updateUserError);
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Erro ao atualizar usuário para revoked' }),
        };
      }

      console.log('[✅ Usuário marcado como revoked]');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário convidado excluído e status atualizado' }),
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
