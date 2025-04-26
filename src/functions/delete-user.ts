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

  if (!inviteId || !userId) {
    console.error('❌ [ERRO] inviteId ou userId ausentes:', { inviteId, userId });
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invite ID e User ID são obrigatórios' }),
    };
  }

  try {
    // 1. Deleta da tabela invited_users
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

    // 2. Deleta do auth.users
    console.log('🚀 [PASSO 2] Deletando usuário do Auth...');
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      // 🔥 Correção aqui: NÃO vai mais barrar tudo, apenas loga e segue.
      console.warn('⚠️ [AVISO] Erro ao tentar deletar usuário no Auth (talvez nem exista):', deleteAuthError);
    } else {
      console.log('✅ [PASSO 2] Usuário deletado do Auth.users.');
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
