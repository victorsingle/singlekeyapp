import { supabase } from '../supabase';
import { useAuthStore } from '../../stores/authStore';

export async function logKaiPrompt(prompt: string) {
  const { userId, email, fullName, role, organization } = useAuthStore.getState();

  const payload = {
    user_name: fullName || '',
    user_email: email,
    user_role: role,
    organization_name: organization?.name || '',
    organization_cnpj: organization?.cnpj || '',
    ciclo_nome: null,
    prompt,
    modelo_ia: 'gpt-4o',
    context_tags: [],
    interface_origem: 'web',
    ip_address: null,
    user_agent: navigator.userAgent,
    lang: navigator.language
  };

  try {
    await supabase.from('okr_kai_prompts').insert([payload]);
  } catch (error) {
    console.warn('[⚠️ Erro ao logar prompt da KAI]', error);
  }
}
