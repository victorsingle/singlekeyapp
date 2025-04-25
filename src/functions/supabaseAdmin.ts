import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Não usar no frontend, mas aqui é função Netlify
);
