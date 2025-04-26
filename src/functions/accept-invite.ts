import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Método não permitido' }),
    };
  }

  const { token, password } = JSON.parse(event.body || '{}');

  if (!token || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Token e senha são obrigatórios' }),
    };
  }

  // 1. Valida o token e busca dados do convite
  const { data: invitedUser, error: inviteError } = await supabaseAdmin
    .from('invited_users')
    .select('email, first_name, last_name, company_name, phone')
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle(); // 👈 aqui troca .single() por .maybeSingle()

  if (inviteError || !invitedUser || !invitedUser.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Convite inválido ou expirado' }),
    };
  }

  const { email, first_name, last_name, company_name, phone } = invitedUser;

  // 2. Cria o usuário no auth com e-mail confirmado + user_metadata
  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      ...(first_name && { firstName: first_name }),
      ...(last_name && { lastName: last_name }),
      ...(company_name && { companyName: company_name }),
      ...(phone && { phone }),
    },
  });

  if (createError) {
    console.error('[❌ Erro ao criar usuário]', createError);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Erro ao criar usuário. Talvez já tenha sido usado.' }),
    };
  }

  // 3. Atualiza o status do convite
  await supabaseAdmin
    .from('invited_users')
    .update({ status: 'accepted' })
    .eq('token', token);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Usuário criado com sucesso' }),
  };
};

export { handler };
