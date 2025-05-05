import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useTokenUsage() {
  const [usado, setUsado] = useState(0);
  const [limite, setLimite] = useState(0);
  const [percentual, setPercentual] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  useEffect(() => {
    const fetchUsage = async () => {
      console.log('[🔄 useTokenUsage] iniciado');
      setIsLoading(true);

      const today = new Date();
      const mesReferencia = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        console.warn('[⚠️] Usuário não logado.');
        return;
      }

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('owner_user_id', userId)
        .maybeSingle();

      if (!account?.id) {
        console.warn('[⚠️] Conta não encontrada para usuário.');
        return;
      }

      const accountId = account.id;

      // Busca o uso do mês atual
      const { data: usageRow, error: usageError } = await supabase
        .from('usage_tokens')
        .select('*')
        .eq('account_id', accountId)
        .eq('mes_referencia', mesReferencia)
        .maybeSingle();

      if (usageError) {
        console.error('[❌ useTokenUsage] erro ao buscar usage:', usageError);
        return;
      }

      if (!usageRow) {
        console.log('[🧠 useTokenUsage] linha não encontrada — executando renovar_creditos_tokens');
      
        const { error: rpcError } = await supabase.rpc('renovar_creditos_tokens');
        if (rpcError) {
          console.error('[❌ useTokenUsage] erro ao renovar créditos:', rpcError);
          return;
        }
      
        // Rebusca a linha após inserção
        const { data: novaRow, error: novaErro } = await supabase
          .from('usage_tokens')
          .select('*')
          .eq('account_id', accountId)
          .eq('mes_referencia', mesReferencia)
          .maybeSingle();
      
        if (!novaRow || novaErro) {
          console.warn('[⚠️] Linha ainda não encontrada após RPC');
          return;
        }
      
        const usados = novaRow.tokens_utilizados ?? 0;
        const limiteMensal = novaRow.limite_mensal ?? 0;
        const perc = limiteMensal > 0 ? Math.round((usados / limiteMensal) * 100) : 0;
      
        setUsado(usados);
        setLimite(limiteMensal);
        setPercentual(perc);
        setIsLoading(false);
        return;
      }

      // Linha já existente
      const usados = usageRow.tokens_utilizados ?? 0;
      const limiteMensal = usageRow.limite_mensal ?? 0;
      const perc = limiteMensal > 0 ? Math.round((usados / limiteMensal) * 100) : 0;

      setUsado(usados);
      setLimite(limiteMensal);
      setPercentual(perc);
      setIsLoading(false);
    };

    fetchUsage();
  }, [refetchTrigger]);

  return { usado, limite, percentual, isLoading, refetch };
}
