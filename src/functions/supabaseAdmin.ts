import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,             // <- sem "VITE_" no server
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // <- certo
);
