import type { Handler, HandlerEvent } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event: HandlerEvent) => {
  const userId = event.queryStringParameters?.user_id;

  if (!userId) {
    console.log('[❌ user_id ausente]');
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'ID do usuário ausente' }),
    };
  }

  console.log('[🔍 Ativando usuário no auth.users]:', userId);

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      console.error('[❌ Erro ao ativar no auth.users]', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Erro ao ativar usuário no auth' }),
      };
    }

    console.log('[✅ Usuário ativado no auth.users]');

    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.VITE_APP_URL}/login?confirmado=1`,
      },
      body: '',
    };
  } catch (err) {
    console.error('[❌ Erro inesperado]', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado' }),
    };
  }
};

export { handler };
