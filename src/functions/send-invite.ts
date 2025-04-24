import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  const { email, firstName, token } = JSON.parse(event.body || '{}');

  if (!email || !firstName || !token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Campos obrigatórios ausentes' }),
    };
  }

  const inviteLink = `${process.env.VITE_APP_URL}/convite?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: 'SingleKey <onboarding@resend.dev>', // ou um domínio real se tiver
      to: email,
      subject: 'Você foi convidado para o SingleKey',
      html: `
        <div style="font-family: sans-serif; padding: 24px;">
          <h2>Olá, ${firstName}!</h2>
          <p>Você foi convidado para colaborar no SingleKey.</p>
          <p>Clique no botão abaixo para acessar sua conta:</p>
          <a href="${inviteLink}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Aceitar Convite</a>
          <p style="margin-top: 24px; font-size: 12px; color: #888;">Se você não reconhece este convite, apenas ignore este e-mail.</p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (err: any) {
    console.error('[❌ Email Error]', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro ao enviar e-mail de convite' }),
    };
  }
};

export { handler };
