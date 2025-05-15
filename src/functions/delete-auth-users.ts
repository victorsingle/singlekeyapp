import { supabaseAdmin } from './supabaseAdmin';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Deleta usuário principal
    const { error: mainError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (mainError) throw mainError;

    // Busca e deleta usuários convidados
    const { data: invited, error: invitedError } = await supabaseAdmin
      .from('invited_users')
      .select('user_id')
      .eq('invited_by', userId);

    if (invitedError) throw invitedError;

    for (const { user_id } of invited ?? []) {
      if (user_id) {
        await supabaseAdmin.auth.admin.deleteUser(user_id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[❌ Erro ao apagar auth.users]', err);
    return new Response(JSON.stringify({ error: 'Falha ao apagar usuários de autenticação.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
