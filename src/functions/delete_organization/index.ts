import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  // Trata requisições de pré-vôo (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*', // ou 'http://localhost:5173' no dev
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service Role para deletar usuários
  );

  // Obtém o usuário autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response('Usuário não autenticado', { status: 401 });
  }

  // Busca a organização que ele criou
  const { data: org, error: orgError } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_user_id', user.id)
    .single();

  if (orgError || !org) {
    return new Response('Organização não encontrada', { status: 404 });
  }

  const organizationId = org.id;

  // Chama função RPC para deletar dados relacionais
  const { error: deleteError } = await supabase.rpc('delete_organization_data', {
    org_id: organizationId,
  });

  if (deleteError) {
    console.error('Erro ao deletar dados da organização:', deleteError);
    return new Response('Erro ao excluir dados da organização', { status: 500 });
  }

  // Remove o próprio usuário da tabela de autenticação (auth.users)
  const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
  if (authError) {
    console.error('Erro ao deletar usuário auth:', authError);
    return new Response('Erro ao excluir usuário', { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    
    status: 200,
  });
});
