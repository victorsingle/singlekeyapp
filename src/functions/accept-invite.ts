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
  .select('id, email, first_name, last_name, company_name, phone')
  .eq('token', token)
  .eq('status', 'pending')
  .single();

  if (inviteError || !invitedUser) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Convite inválido ou expirado' }),
    };
  }
  
  const { id, email, first_name, last_name, company_name, phone } = invitedUser;

  console.log('[🛠️ Payload para criar usuário]:', {
    email,
    firstName: first_name,
    lastName: last_name,
    companyName: company_name,
    phone,
  });

  // 2. Cria o usuário no auth com e-mail confirmado e metadados
  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      firstName: first_name || '',
      lastName: last_name || '',
      companyName: company_name || '',
      phone: phone || '',
    },
  });

  console.log('[📥 Resultado criação de usuário]:', createdUser);

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
  .update({ status: 'active' })
  .eq('id', invitedUser.id)

  if (updateError) {
    console.error('[❌ Erro ao atualizar status do convite]', updateError);
  } else {
    console.log('[✅ convite aceito com sucesso!]');
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Usuário criado com sucesso' }),
  };
};

export { handler };
