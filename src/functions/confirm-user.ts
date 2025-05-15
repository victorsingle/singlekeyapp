import type { Handler, HandlerEvent } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event: HandlerEvent) => {

  const token = event.queryStringParameters?.token;

  if (!token) {
    console.error('[❌ Token ausente no link de ativação]');
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Token de ativação ausente.' }),
    };
  }

  try {
    // 1. Buscar o token na tabela confirmation_tokens
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('confirmation_tokens')
      .select('user_id, expires_at, confirmed_at')
      .eq('token', token)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error('[❌ Token inválido ou não encontrado]', tokenError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Token inválido ou expirado.' }),
      };
    }

    if (tokenData.confirmed_at) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Este link já foi utilizado.' }),
      };
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Token expirado.' }),
      };
    }

    const userId = tokenData.user_id;

    // 2. Buscar dados do usuário
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, company_name, email, temp_password')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !userData) {
      console.error('[❌ Erro ao buscar usuário no banco]', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Erro ao buscar usuário para ativação.' }),
      };
    }

    const { first_name, last_name, company_name, email, temp_password } = userData;

    if (!temp_password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Senha temporária não encontrada para o usuário.' }),
      };
    }

    // 3. Criar o usuário no Supabase Auth
    console.log('[⚠️ Tentando criar no Auth]', { email, password: temp_password }); 
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temp_password,
      user_metadata: { userId },
      email_confirm: true,
    });

    if (createError || !createdUser?.user?.id) {
      console.error('[❌ Erro ao criar usuário no auth.users]', createError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Erro ao criar usuário no auth.' }),
      };
    }

    console.log('[✅ Criado no auth]', createdUser.user.id); // e aqui
    const authUserId = createdUser.user.id;

    // 4. Atualizar o display_name no auth (opcional)
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      user_metadata: {
        full_name: `${first_name} ${last_name}`,
      },
    });

    // 5. Atualizar o campo user_id
    await supabaseAdmin
      .from('users')
      .update({ user_id: authUserId })
      .eq('id', userId);

    // 6. Criar a organização
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .insert({
        owner_user_id: authUserId,
        name: company_name,
      })
      .select()
      .maybeSingle();

    if (accountError || !accountData?.id) {
      console.error('[❌ Erro ao criar organização]', accountError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Erro ao criar organização.' }),
      };
    }

    const organizationId = accountData.id;

    // 7. Atualizar o organization_id do usuário
    await supabaseAdmin
      .from('users')
      .update({ organization_id: organizationId })
      .eq('id', userId);

    // 8. Marcar o token como usado
    await supabaseAdmin
      .from('confirmation_tokens')
      .update({ confirmed_at: new Date() })
      .eq('token', token);

    console.log('[✅ Usuário ativado e organização criada com sucesso.]');

    // 9. Limpa a senha temporária por segurança
    await supabaseAdmin
      .from('users')
      .update({ temp_password: null })
      .eq('id', userId);

    // 10. Redirecionar para login
    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.VITE_APP_URL}/login?confirmado=1`,
      },
      body: '',
    };
  } catch (err) {
    console.error('[❌ Erro inesperado no fluxo de confirmação]', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado.' }),
    };
  }
};

export { handler };
