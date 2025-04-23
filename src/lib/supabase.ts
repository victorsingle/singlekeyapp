import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;  // Use a chave `service_role` aqui

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);  // Agora usando a chave `service_role`
