import type { Handler, HandlerEvent } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event: HandlerEvent) => {
  const userId = event.queryStringParameters?.user_id;
  const email = event.queryStringParameters?.email;
  const password = event.queryStringParameters?.password;

  if (!userId || !email || !password) {
    console.error('[❌ Dados ausentes no link de ativação]', { userId, email, password });
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Parâmetros obrigatórios ausentes.' }),
    };
  }

  console.log('[🔍 Criando usuário no auth.users]:', { userId, email });

  try {
    // 1. Buscar dados do usuário no banco de dados `users`
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, company_name')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !userData) {
      console.error('[❌ Erro ao buscar usuário no banco]', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Erro ao buscar usuário para ativação.' }),
      };
    }

    const { first_name, last_name, company_name } = userData;

    // 2. Criar o usuário no Supabase Auth
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
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

    const authUserId = createdUser.user.id;

    // 3. Atualizar o display_name no auth (opcional)
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      user_metadata: {
        full_name: `${first_name} ${last_name}`,
      },
    });

    // 4. Atualizar a tabela `users` preenchendo o campo `user_id`
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({ user_id: authUserId })
      .eq('id', userId);

    if (updateUserError) {
      console.error('[❌ Erro ao atualizar user_id no banco]', updateUserError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Erro ao atualizar cadastro do usuário.' }),
      };
    }

    // 5. Criar a organização (account)
    console.log('[🔨 Criando organização para o usuário]:', { userId, company_name });

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

    // 6. Atualizar o usuário preenchendo o organization_id
    const { error: updateOrganizationError } = await supabaseAdmin
      .from('users')
      .update({ organization_id: organizationId })
      .eq('id', userId);

    if (updateOrganizationError) {
      console.error('[❌ Erro ao atualizar organization_id no usuário]', updateOrganizationError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Erro ao vincular organização ao usuário.' }),
      };
    }

    console.log('[✅ Usuário criado, organização criada e tudo vinculado corretamente.]');

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
      body: JSON.stringify({ message: 'Erro inesperado.' }),
    };
  }
};

export { handler };
