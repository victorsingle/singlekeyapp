import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOKRStore } from '../stores/okrStore';

export function useTeamScoreboardData(organizationId: string | null) {
  const cycleId = useOKRStore(state => state.selectedCycleId);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[DEBUG] Entrou no useEffect com:', { organizationId, cycleId });

    if (!organizationId || !cycleId) {
      console.log('[DEBUG] 🚫 Abortando por falta de dados');
      return;
    }

    (async () => {
      console.log('[DEBUG] ⏳ Buscando dados do placar por time...');
      setLoading(true);
      setError(null);

      try {
        const { data: links, error: linksError } = await supabase
          .from('team_key_results')
          .select('*');

        if (linksError) throw linksError;
        console.log('[DEBUG] 🔄 links:', links);

        const krIds = links.map(l => l.key_result_id);
        const teamIds = [...new Set(links.map(l => l.team_id))];
        console.log('[DEBUG] keyResultIds esperados:', krIds);

        if (krIds.length === 0) {
          setData([]);
          return;
        }

        const { data: keyResults, error: krError } = await supabase
          .from('key_results')
          .select(`
            id, text, initial_value, target_value, progress, unit, okr_id,
            okr:okr_id ( id, cycle_id, organization_id, type )
          `)
          .in('id', krIds);

        if (krError) throw krError;
        console.log('[DEBUG] 🔄 keyResults:', keyResults);

        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds);

        if (teamsError) throw teamsError;
        console.log('[DEBUG] 🔄 teams:', teams);

        const grouped = new Map();

        for (const row of links) {
          const kr = keyResults.find(k => k.id === row.key_result_id);
          if (!kr) {
            console.log('[❌] KR não encontrado para:', row.key_result_id);
            continue;
          }

          const teamName = teams.find(t => t.id === row.team_id)?.name ?? 'Sem time';
          console.log('[🔁] Associando KR:', kr.text, '→', teamName);

          if (!grouped.has(teamName)) grouped.set(teamName, []);
          grouped.get(teamName).push({
            id: kr.id,
            texto: kr.text,
            nivel: kr.okr?.type ?? '-',
            baseline: kr.initial_value?.toString() ?? '-',
            target: kr.target_value?.toString() ?? '-',
            progresso: parseFloat((kr.progress ?? 0).toFixed(1)),
          });
        }

        const result = Array.from(grouped.entries()).map(([teamName, keyResults]) => ({
          teamName,
          keyResults,
        }));

        console.log('[✅] Resultado final agrupado:', result);
        setData(result);
      } catch (err) {
        console.error('[❌ useTeamScoreboardData]', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId, cycleId]);

  return { data, loading, error };
}
