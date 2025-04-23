import { supabase } from '../lib/supabase';

export const getUserId = async (): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw error || new Error('Usuário não autenticado');
  return user.id;
};
