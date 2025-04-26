import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event) => {
  console.log('🛬 [INÍCIO] delete-user.ts chamado');

  if (event.httpMethod !== 'POST') {
    console.error('❌ [ERRO] Método não permitido:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Método não permitido' }),
    };
  }

  let bodyParsed;
  try {
    bodyParsed = JSON.parse(event.body || '{}');
  } catch (err) {
    console.error('❌ [ERRO] Falha ao fazer parse do body:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Body inválido' }),
    };
  }

  const { inviteId, userId } = bodyParsed;
  console.log('📥 [INPUT RECEBIDO]', { inviteId, userId });

  if (!inviteId || !userId) {
    console.error('❌ [ERRO] inviteId ou userId ausentes:', { inviteId, userId });
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invite ID e User ID são obrigatórios' }),
    };
  }

  try {
    // 1. Deletar da tabela invited_users
    console.log('🚀 [PASSO 1] Tentando deletar convite da tabela invited_users...');
    const { error: deleteInviteError } = await supabaseAdmin
      .from('invited_users')
      .delete()
      .eq('id', inviteId);

    if (deleteInviteError) {
      console.error('❌ [ERRO] Falha ao deletar na invited_users:', deleteInviteError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao deletar o convite' }),
      };
    }

    console.log('✅ [PASSO 1] Invite deletado da tabela invited_users.');

    // 2. Bloquear o usuário no Auth
    console.log('🚀 [PASSO 2] Tentando bloquear usuário no Auth (banned_until)...');
    const { data: updatedUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      banned_until: '9999-12-31T23:59:59Z',
      confirmed_at: null,
    });

    if (updateAuthError) {
      console.error('❌ [ERRO] Falha ao bloquear no Auth:', updateAuthError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao bloquear usuário no Auth' }),
      };
    }

    console.log('✅ [PASSO 2] Usuário bloqueado no Auth.', updatedUser);

    // 3. Forçar revogação da sessão
    console.log('🚀 [PASSO 3] Tentando revogar sessões do usuário...');
    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(userId);

    if (revokeError) {
      console.warn('⚠️ [WARNING] Falha ao revogar sessões (seguindo mesmo assim):', revokeError);
    } else {
      console.log('✅ [PASSO 3] Sessões revogadas com sucesso.');
    }

    console.log('🏁 [FIM] Processo de exclusão concluído com sucesso.');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário convidado removido, bloqueado e sessões revogadas' }),
    };

  } catch (err) {
    console.error('❌ [ERRO FATAL] Exceção inesperada no handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado no processo de exclusão' }),
    };
  }
};

export { handler };
