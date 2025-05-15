import { supabaseAdmin } from './supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;

  try {
    // 1. Apaga o próprio usuário
    await supabaseAdmin.auth.admin.deleteUser(userId);

    // 2. Apaga convidados que ele convidou
    const { data: invited } = await supabaseAdmin
      .from('invited_users')
      .select('user_id')
      .eq('invited_by', userId);

    for (const { user_id } of invited ?? []) {
      if (user_id) {
        await supabaseAdmin.auth.admin.deleteUser(user_id);
      }
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[❌ Erro ao apagar auth.users]', err);
    return res.status(500).json({ error: 'Falha ao apagar usuários de autenticação.' });
  }
}
