import type { Handler, HandlerEvent } from '@netlify/functions';
import { supabaseAdmin } from './supabaseAdmin';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

const resend = new Resend(process.env.RESEND_API_KEY);

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Método não permitido' }),
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body || '{}');
  } catch (err) {
    console.error('[❌ Erro ao fazer parse do JSON]', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Erro no formato do JSON recebido.' }),
    };
  }

  const { email, password, companyName, firstName, lastName, phone } = parsed;

  if (!email || !password || !companyName?.trim() || !firstName?.trim() || !lastName?.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Campos obrigatórios ausentes ou inválidos.' }),
    };
  }

  try {
    const userId = uuidv4();

    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        company_name: companyName,
        first_name: firstName,
        last_name: lastName,
        phone,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('[❌ Erro ao salvar no banco]', insertError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Erro ao salvar usuário no banco.' }),
      };
    }

    // Gera token único e salva no Supabase
    const token = uuidv4();

    await supabaseAdmin.from('confirmation_tokens').insert({
      user_id: userId,
      token,
      expires_at: new Date(Date.now() + 1000 * 60 * 60), // expira em 1h
    });

    const activationLink = `${process.env.VITE_APP_URL}/.netlify/functions/confirm-user?token=${token}`;

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
      body: JSON.stringify({ message: 'Usuário criado com sucesso. E-mail de ativação enviado.' }),
    };
  } catch (error) {
    console.error('[❌ Erro inesperado no cadastro]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro inesperado. Tente novamente.' }),
    };
  }
};

export { handler };
