import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY); // sua API Key da Resend

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Método não permitido' }),
    };
  }

  const { email, password, companyName, firstName, lastName, phone } = JSON.parse(event.body || '{}');

  if (!email || !password || !companyName || !firstName || !lastName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Campos obrigatórios ausentes' }),
    };
  }

  try {
    // 1. Cria o usuário no auth com email_confirm: false (não confirmado ainda)
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // ⚡ deixa pendente até ele ativar
    });

    if (createError || !createdUser.user) {
      console.error('[❌ Erro ao criar usuário no Auth]', createError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao criar usuário. Talvez já exista.' }),
      };
    }

    // 2. Insere o registro na tabela users
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      user_id: createdUser.user.id,
      email,
      company_name: companyName,
      first_name: firstName,
      last_name: lastName,
      phone,
      role: 'admin', // 👈 marca como admin
      status: 'pending', // opcional: pending até ativar
    });

    if (insertError) {
      console.error('[❌ Erro ao salvar no banco]', insertError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao registrar usuário.' }),
      };
    }

    // 3. Gera um link de ativação manual (com o ID do user)
    const activationLink = `${process.env.FRONTEND_URL}/ativar?user_id=${createdUser.user.id}`;

    // 4. (Opcional) Dispara e-mail pelo Resend
    await resend.emails.send({
      from: 'SingleKey <no-reply@singlekey.app>',
      to: email,
      subject: 'Confirme sua conta no SingleKey',
      html: `
        <div style="font-family: sans-serif; padding: 24px;">
          <h2>Olá, ${firstName}!</h2>
          <p>Seu cadastro no SingleKey foi recebido. Clique no botão abaixo para confirmar e ativar sua conta:</p>
          <a href="${activationLink}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Ativar Conta</a>
          <p style="margin-top: 24px; font-size: 12px; color: #888;">Se você não reconhece este cadastro, ignore este e-mail.</p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário criado e e-mail de ativação enviado.' }),
    };

  } catch (error) {
    console.error('[❌ Erro inesperado]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado. Tente novamente.' }),
    };
  }
};

export { handler };
