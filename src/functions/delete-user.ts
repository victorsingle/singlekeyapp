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
    console.error('❌ [ERRO] Body inválido:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Body inválido' }),
    };
  }

  const { inviteId, userId } = bodyParsed;
  console.log('📥 [INPUT RECEBIDO]', { inviteId, userId });

  if (!inviteId) {
    console.error('❌ [ERRO] inviteId ausente:', { inviteId, userId });
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invite ID é obrigatório' }),
    };
  }

  try {
    // Sempre deleta o convite primeiro
    console.log('🚀 [PASSO 1] Deletando convite...');
    const { error: deleteInviteError } = await supabaseAdmin
      .from('invited_users')
      .delete()
      .eq('id', inviteId);

    if (deleteInviteError) {
      console.error('❌ [ERRO] Falha ao deletar convite:', deleteInviteError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao deletar o convite' }),
      };
    }
    console.log('✅ [PASSO 1] Convite removido.');

    if (userId) {
      // Se tiver userId, é porque o usuário ativou -> tenta deletar também do Auth
      console.log('🚀 [PASSO 2] Deletando usuário do Auth...');
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteAuthError) {
        console.warn('⚠️ [AVISO] Erro ao tentar deletar usuário no Auth (talvez nem exista):', deleteAuthError);
      } else {
        console.log('✅ [PASSO 2] Usuário deletado do Auth.users.');
      }
    } else {
      console.log('ℹ️ [INFO] Sem userId, pulando deleção no Auth (usuário pending).');
    }

    console.log('🏁 [FIM] Processo de exclusão concluído.');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário convidado removido (e Auth deletado se existia).' }),
    };

  } catch (err) {
    console.error('❌ [ERRO FATAL] Exceção inesperada:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado ao excluir o usuário.' }),
    };
  }
};

export { handler };
