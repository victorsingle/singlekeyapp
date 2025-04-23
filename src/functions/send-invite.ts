// /src/pages/api/send-invite.ts (caso esteja usando Next.js Pages Router)
// Forçando o deploy
import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, firstName, token } = req.body;

  if (!email || !firstName || !token) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  const inviteLink = `${process.env.APP_URL}/convite?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: 'SingleKey <onboarding@resend.dev>', // Precisa configurar domínio no Resend
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

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[❌ Email Error]', err);
    return res.status(500).json({ message: 'Erro ao enviar e-mail de convite' });
  }
}
