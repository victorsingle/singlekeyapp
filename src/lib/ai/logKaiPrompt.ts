import { supabase } from '../supabase';
import { useAuthStore } from '../../stores/authStore';

// 🔎 Função para obter IP público do usuário
async function getUserIp() {
  try {
    const res = await fetch('https://api64.ipify.org?format=json');
    const data = await res.json();
    return data.ip ?? null;
  } catch (err) {
    console.warn('[⚠️] Falha ao obter IP:', err);
    return null;
  }
}

/**
 * Registra no Supabase o prompt utilizado na geração de OKRs via KAI.
 * @param prompt - Texto inserido pelo usuário
 * @param cicloTema - Tema estratégico do ciclo gerado (opcional)
 */
export async function logKaiPrompt(prompt: string, cicloTema?: string) {
  const store = useAuthStore.getState();

  const ip = await getUserIp(); // ← captura IP antes de montar o payload

  const payload = {
    user_name: store.firstName || '',
    user_role: store.role,
    organization_name: store.companyName || '',
    organization_cnpj: null,
    ciclo_tema_estrategico: cicloTema ?? null,
    prompt,
    modelo_ia: 'gpt-4o',
    context_tags: [],
    interface_origem: 'web',
    ip_address: ip,
    user_agent: navigator.userAgent,
    lang: navigator.language,
    organization_id: store.organizationId,
  };

  console.log('[📤 Enviando log da KAI]', payload);

  const { error, status } = await supabase.from('okr_kai_prompts').insert([payload]);

  if (error) {
    console.error('[❌ Erro ao registrar log da KAI]', status, error.message, error.details);
    throw error;
  }

  console.log('[✅ Prompt da KAI registrado com sucesso]');
}
