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

  // 1. Valida o token
  const { data: invitedUser, error: inviteError } = await supabaseAdmin
  .from('invited_users')
  .select('id, email') 
  .eq('token', token)
  .eq('status', 'pending')
  .single();

  if (inviteError || !invitedUser) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Convite inválido ou expirado' }),
    };
  }

  // 2. Cria o usuário no auth com e-mail confirmado
  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: invitedUser.email,
    password,
    email_confirm: true,
  });

  if (createError) {
    console.error('[❌ Erro ao criar usuário]', createError);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Erro ao criar usuário. Talvez já tenha sido usado.' }),
    };
  }

  // 3. Atualiza o status do convite
  const { error: updateError } = await supabaseAdmin
  .from('invited_users')
  .update({ status: 'accepted' })
  .eq('id', invitedUser.id);

  if (updateError) {
    console.error('[❌ Erro ao atualizar status do convite]', updateError);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Usuário criado com sucesso' }),
  };
};

export { handler };
