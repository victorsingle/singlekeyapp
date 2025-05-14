import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
  global: {
    headers: {
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
    }
  }
});
serve(async (req)=>{
  const origin = req.headers.get("origin") ?? "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({
        error: "Token não fornecido"
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    // Verifica o usuário autenticado
    const userRes = await supabase.auth.getUser(token);
    const user = userRes.data?.user;
    if (!user) {
      return new Response(JSON.stringify({
        error: "Usuário não autenticado"
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    const userId = user.id;
    // Busca organização vinculada a ele
    const { data: orgData, error: orgError } = await supabase.from("accounts").select("id").eq("admin_id", userId).single();
    if (orgError || !orgData) {
      return new Response(JSON.stringify({
        error: "Organização não encontrada"
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    const organizationId = orgData.id;
    // Deleta os dados relacionados em ordem segura
    const tablesToDelete = [
      "checkins",
      "key_results",
      "okrs",
      "organization_users",
      "team_members",
      "teams",
      "users",
      "invited_users"
    ];
    for (const table of tablesToDelete){
      await supabase.from(table).delete().eq("organization_id", organizationId);
    }
    // Deleta a própria conta da organização
    await supabase.from("accounts").delete().eq("id", organizationId);
    // Por fim, deleta o usuário do auth
    await supabase.auth.admin.deleteUser(userId);
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Erro inesperado",
      details: String(err)
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
