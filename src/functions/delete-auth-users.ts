import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin'; // deve exportar um client com service role

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = JSON.parse(event.body || '{}');

    if (!userId) {
      return { statusCode: 400, body: 'Missing userId' };
    }

    // 1. Deleta o próprio usuário
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw deleteError;
    }

    // 2. Busca convidados e deleta
    const { data: invited, error: invitedError } = await supabaseAdmin
      .from('invited_users')
      .select('user_id')
      .eq('invited_by', userId);

    if (invitedError) throw invitedError;

    for (const { user_id } of invited ?? []) {
      if (user_id) {
        await supabaseAdmin.auth.admin.deleteUser(user_id);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };

  } catch (err) {
    console.error('[❌ Erro ao apagar auth.users]', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falha ao apagar usuários de autenticação.' }),
    };
  }
};

export { handler as default };
