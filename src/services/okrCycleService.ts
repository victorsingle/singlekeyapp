import { supabase } from '../lib/supabase';
import { keysToCamel } from '../utils/case';


function formatDateText(date: string) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0]; // Retorna no formato YYYY-MM-DD
}

/**
 * Cria um novo ciclo de OKRs.
 * @param cycleData - Objeto com os dados do ciclo.
 */
export async function createCycle(cycleData: any) {
  // ─────────────────────────────────────────────
  // 1. Normaliza nomes — aceita camelCase OU snake_case
  // ─────────────────────────────────────────────
  const name            = cycleData.name;

  const startDate       = cycleData.startDate      ?? cycleData.start_date;
  const endDate         = cycleData.endDate        ?? cycleData.end_date;
  const organizationId  = cycleData.organizationId ?? cycleData.organization_id;
  const userId          = cycleData.userId         ?? cycleData.user_id;

  const status          = cycleData.status         ?? 'active';
  const strategicTheme  = cycleData.strategicTheme ?? cycleData.strategic_theme ?? null;

  // ─────────────────────────────────────────────
  // 2. Validação
  // ─────────────────────────────────────────────
  if (!name || !startDate || !endDate || !organizationId || !userId) {
    throw new Error('Dados obrigatórios para criar ciclo estão faltando.');
  }

  // ─────────────────────────────────────────────
  // 3. Insert (sempre em snake_case)
  // ─────────────────────────────────────────────
  const { data, error } = await supabase
    .from('okr_cycles')
    .insert([{
      name,
      start_date:      startDate,
      end_date:        endDate,
      organization_id: organizationId,
      user_id:         userId,
      status,
      strategic_theme: strategicTheme,
    }])
    .select()
    .maybeSingle();

  if (error) {
    console.error('[❌ Supabase insert error]', error); // mostra code/details
    throw new Error(`Erro ao criar ciclo: ${error.message}`);
  }

  return data;       // devolve o ciclo criado
}

/**
 * Atualiza um ciclo de OKRs existente.
 * @param cycleId - ID do ciclo.
 * @param updates - Campos a serem atualizados.
 */
export async function updateCycle(cycleId, updates) {
  if (!cycleId || !updates || Object.keys(updates).length === 0) {
    throw new Error('Dados obrigatórios para atualizar ciclo estão faltando.');
  }

  const { data, error } = await supabase
    .from('okr_cycles')
    .update(updates)
    .eq('id', cycleId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao atualizar ciclo: ${error.message}`);
  }

  return data;
}

/**
 * Busca todos os ciclos de OKRs de uma organização.
 * @param organizationId - ID da organização.
 */

export async function fetchCycles(organizationId: string) {
  if (!organizationId) {
    throw new Error('ID da organização é obrigatório para buscar ciclos.');
  }

  const { data, error } = await supabase
    .from('okr_cycles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('start_date', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar ciclos: ${error.message}`);
  }

  const formatted = (data ?? []).map((item) => {
    const camel = keysToCamel(item);
    return {
      ...camel,
      startDateText: camel.startDate ? formatDateText(camel.startDate) : null,
      endDateText: camel.endDate ? formatDateText(camel.endDate) : null,
    };
  });

  return formatted;
}

/**
 * Deleta um ciclo de OKRs.
 * @param cycleId - ID do ciclo.
 */
export async function deleteCycle(cycleId) {
  if (!cycleId) {
    throw new Error('ID do ciclo é obrigatório para deletar.');
  }

  const { error } = await supabase
    .from('okr_cycles')
    .delete()
    .eq('id', cycleId);

  if (error) {
    throw new Error(`Erro ao deletar ciclo: ${error.message}`);
  }

  return true;
}
