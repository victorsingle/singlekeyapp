import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event) => {
  const user_id = event.queryStringParameters?.user_id;

  if (!user_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Parâmetro user_id ausente' }),
    };
  }

  try {
    // 1. Confirma o e-mail do usuário no Supabase Auth
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email_confirm: true,
    });

    if (confirmError) {
      console.error('[❌ Erro ao confirmar e-mail]', confirmError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao confirmar o e-mail do usuário.' }),
      };
    }

    // 2. (Opcional) Atualiza o status na tabela users para "active"
    await supabaseAdmin.from('users').update({ status: 'active' }).eq('user_id', user_id);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('[❌ Erro inesperado]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado ao confirmar o usuário.' }),
    };
  }
};

export { handler };
