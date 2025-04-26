import type { Handler, HandlerEvent } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event: HandlerEvent) => {
  const userId = event.queryStringParameters?.user_id;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'ID do usuário ausente' }),
    };
  }

  try {
    // Marca como ativo
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ status: 'active' })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[❌ Erro ao ativar usuário]', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Erro ao ativar usuário' }),
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.VITE_APP_URL}/login?confirmado=1`,
      },
      body: '',
    };
  } catch (error) {
    console.error('[❌ Erro inesperado]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado' }),
    };
  }
};

export { handler };
