import { supabase } from './supabase';

/**
 * Atualiza o uso de tokens da conta no mês corrente.
 */
export async function trackTokenUsage(accountId: string, tokens: number) {
  try {
    const today = new Date();
    const mesReferencia = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    // Tenta buscar linha existente
    const { data: usoExistente, error } = await supabase
      .from('usage_tokens')
      .select('tokens_utilizados, limite_mensal')
      .eq('account_id', accountId)
      .eq('mes_referencia', mesReferencia)
      .maybeSingle();

    if (error) throw error;

    if (usoExistente) {
      // Atualiza linha existente
      await supabase
        .from('usage_tokens')
        .update({
          tokens_utilizados: usoExistente.tokens_utilizados + tokens,
        })
        .eq('account_id', accountId)
        .eq('mes_referencia', mesReferencia);
    } else {
      // Cria nova linha com tokens utilizados
      await supabase
        .from('usage_tokens')
        .insert({
          account_id: accountId,
          mes_referencia: mesReferencia,
          tokens_utilizados: tokens,
          limite_mensal: 10000, // padrão para planos, ou puxe do plano se necessário
        });
    }

    console.log(`[🔄 trackTokenUsage] ${tokens} tokens registrados para ${accountId}`);
  } catch (err) {
    console.error('[❌ trackTokenUsage] erro ao registrar tokens:', err);
  }
}
