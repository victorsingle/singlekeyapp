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

  if (!inviteId || !userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invite ID e User ID são obrigatórios' }),
    };
  }

  console.log('[🚀 Iniciando processo de exclusão e bloqueio]');

  try {
    // 1. Excluir o registro do convite
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

    console.log('[✅ Convite excluído da tabela invited_users]');

    // 2. Bloquear o usuário no Auth (set banned_until = infinity)
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      banned_until: '9999-12-31T23:59:59Z', // praticamente bloqueia para sempre
    });

    if (updateAuthError) {
      console.error('[❌ Erro ao bloquear usuário no Auth]:', updateAuthError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao bloquear usuário no Auth' }),
      };
    }

    console.log('[✅ Usuário bloqueado no Auth (banned_until infinity)]');

    // 3. Forçar logout: revogar sessões
    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(userId);

    if (revokeError) {
      console.warn('[⚠️ Erro ao revogar sessão (seguindo)]:', revokeError);
      // Não travamos o fluxo se falhar
    } else {
      console.log('[✅ Sessão revogada com sucesso]');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário convidado removido, bloqueado e sessão encerrada' }),
    };
  } catch (err) {
    console.error('[❌ Erro inesperado na operação]:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado ao excluir convite e bloquear usuário' }),
    };
  }
};

export { handler };
