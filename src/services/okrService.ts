import { supabase } from '../lib/supabase';
import { keysToCamel } from '../utils/case';
import { useAuthStore } from '../stores/authStore';



/**
 * Busca os OKRs de uma organização e/ou ciclo específico.
 * @param organizationId - ID da organização (obrigatório).
 * @param cycleId - ID do ciclo de planejamento (opcional).
 */
export async function fetchOKRs(organizationId: string, cycleId: string | null = null) {
  if (!organizationId) {
    throw new Error('ID da organização é obrigatório para buscar OKRs.');
  }

  let query = supabase
    .from('okrs')
    .select('*') // <-- sem key_results (*)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (cycleId) {
    query = query.eq('cycle_id', cycleId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar OKRs: ${error.message}`);
  }

  return data || [];
}

/**
 * Busca todos os links de OKRs de uma organização.
 * Como a tabela 'okr_links' não tem organization_id, faz o filtro via os OKRs.
 */
export async function createOKR(okrData) {
  const { objective, type, cycleId, organizationId, createdBy } = okrData;

  if (!objective || !type || !cycleId || !organizationId || !createdBy) {
    throw new Error('Dados obrigatórios para criar OKR estão faltando.');
  }

  const { data, error } = await supabase
    .from('okrs')
    .insert([
      {
        objective,
        type,
        cycle_id: cycleId,
        organization_id: organizationId, // <<-- precisa agora
        created_by: createdBy,
        status: 'draft',
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao criar OKR: ${error.message}`);
  }

  if (!data) {
    throw new Error('Falha inesperada: OKR não foi criado.');
  }

  return data.id;
}

/**
 * Atualiza um OKR existente.
 * @param okrId - ID do OKR que será atualizado.
 * @param updates - Objeto com os campos a serem atualizados.
 */
 export async function updateOKR(okrId, updates) {
  if (!okrId || !updates || Object.keys(updates).length === 0) {
    throw new Error('Dados obrigatórios para atualizar OKR estão faltando.');
  }

  const { data, error } = await supabase
    .from('okrs')
    .update(updates)
    .eq('id', okrId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao atualizar OKR: ${error.message}`);
  }

  return data;
}


/**
* Deleta um OKR pelo ID.
* @param okrId - ID do OKR a ser deletado.
*/
export async function deleteOKR(okrId: string) {
if (!okrId) {
  throw new Error('ID do OKR é obrigatório para deletar.');
}

const { error } = await supabase
  .from('okrs')
  .delete()
  .eq('id', okrId);

if (error) {
  throw new Error(`Erro ao deletar OKR: ${error.message}`);
}
}


export async function fetchOKRLinks(organizationId: string) {
  if (!organizationId) {
    throw new Error('ID da organização é obrigatório para buscar links de OKRs.');
  }

  // Buscar OKRs da organização
  const { data: okrs, error: okrError } = await supabase
    .from('okrs')
    .select('id')
    .eq('organization_id', organizationId);

  if (okrError) {
    throw new Error(`Erro ao buscar OKRs da organização: ${okrError.message}`);
  }

  const okrIds = okrs?.map(o => o.id) || [];

  // Buscar todos os links
  const { data: links, error: linkError } = await supabase
    .from('okr_links')
    .select('*');

  if (linkError) {
    throw new Error(`Erro ao buscar links de OKRs: ${linkError.message}`);
  }

  // Filtrar apenas os links que envolvem OKRs da organização
  const filteredLinks = (links || []).filter(link =>
    okrIds.includes(link.source_okr_id) || okrIds.includes(link.target_okr_id)
  );

  return filteredLinks;
}

/**
 * Cria um link entre dois OKRs.
 */
export async function createOKRLink(sourceOkrId: string, targetOkrId: string, type: string = 'dependency') {
  if (!sourceOkrId || !targetOkrId) {
    throw new Error('IDs de origem e destino são obrigatórios para criar um link.');
  }

  const { data, error } = await supabase
    .from('okr_links')
    .insert([{
      source_okr_id: sourceOkrId,
      target_okr_id: targetOkrId,
      link_type: type 
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar link de OKRs: ${error.message}`);
  }

  return data;
}

/**
 * Deleta um link entre OKRs.
 */
export async function deleteOKRLink(linkId: string) {
  if (!linkId) {
    throw new Error('ID do link é obrigatório para deletar.');
  }

  const { error } = await supabase
    .from('okr_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    throw new Error(`Erro ao deletar link de OKRs: ${error.message}`);
  }
}

/**
 * Cria check-ins iniciais para um OKR e seus Key Results.
 * @param okrId - ID do OKR.
 * @param keyResults - Array de Key Results já criados.
 */
export async function createInitialCheckins(okrId, keyResults) {
    if (!okrId) {
      throw new Error('ID do OKR é obrigatório para criar check-ins.');
    }
  
    // Criar check-in do OKR
    const okrCheckin = {
      okr_id: okrId,
      confidence: 3, // confiança inicial média (ajustável se quiser)
      comment: 'Check-in inicial automático.',
      progress: 0,
    };
  
    // Criar check-ins dos Key Results
    const keyResultsCheckins = keyResults.map((kr) => ({
      key_result_id: kr.id,
      value: kr.initial_value || 0,
      comment: 'Check-in inicial automático.',
    }));
  
    // Executar inserts em paralelo
    const [okrCheckinResult, keyResultsCheckinResult] = await Promise.all([
      supabase.from('okr_checkins').insert([okrCheckin]).select(),
      keyResultsCheckins.length > 0
        ? supabase.from('key_result_checkins').insert(keyResultsCheckins).select()
        : Promise.resolve({ data: [] })
    ]);
  
    if (okrCheckinResult.error) {
      throw new Error(`Erro ao criar check-in inicial do OKR: ${okrCheckinResult.error.message}`);
    }
  
    if (keyResultsCheckinResult.error) {
      throw new Error(`Erro ao criar check-ins iniciais dos Key Results: ${keyResultsCheckinResult.error.message}`);
    }
  
    return {
      okrCheckin: okrCheckinResult.data,
      keyResultsCheckins: keyResultsCheckinResult.data
    };
}


 /**
 * Busca os Key Results de um OKR específico.
 * @param okrId - ID do OKR para buscar os KRs.
 */
 export async function fetchKeyResults(okrId) {
  if (!okrId) {
    throw new Error('ID do OKR é obrigatório para buscar Key Results.');
  }

  const { data, error } = await supabase
    .from('key_results')
    .select('*')
    .eq('okr_id', okrId)
    .order('created_at', { ascending: true }); // ordem do mais antigo para o mais novo

  if (error) {
    throw new Error(`Erro ao buscar Key Results: ${error.message}`);
  }

  return data || [];
}

/**
 * Cria múltiplos Key Results para um OKR.
 * @param keyResults - Array de objetos contendo dados dos Key Results.
 * @param okrId - ID do OKR ao qual os Key Results estão vinculados.
 */
export async function createKeyResults(keyResults, okrId) {
  if (!okrId || !keyResults || keyResults.length === 0) {
    throw new Error('Dados obrigatórios para criar Key Results estão faltando.');
  }

  // Preparamos os dados para o insert
  const recordsToInsert = keyResults.map((kr) => ({
    okr_id: okrId,
    text: kr.text,
    metric: kr.metric || null,
    initial_value: kr.initialValue || null,
    target_value: kr.targetValue || null,
    unit: kr.unit || null,
    progress: kr.progress || 0,
    status: 'draft', // status inicial (pode ajustar depois)
  }));

  const { data, error } = await supabase
    .from('key_results')
    .insert(recordsToInsert)
    .select();

  if (error) {
    throw new Error(`Erro ao criar Key Results: ${error.message}`);
  }

  return data; // retornamos os KRs criados caso o front precise
}


/**
 * Atualiza um Key Result existente.
 * @param keyResultId - ID do Key Result que será atualizado.
 * @param updates - Objeto com os campos a serem atualizados.
 */
export async function updateKeyResult(keyResultId, updates) {
    if (!keyResultId || !updates || Object.keys(updates).length === 0) {
      throw new Error('Dados obrigatórios para atualizar Key Result estão faltando.');
    }
  
    const { data, error } = await supabase
      .from('key_results')
      .update(updates)
      .eq('id', keyResultId)
      .select()
      .maybeSingle();
  
    if (error) {
      throw new Error(`Erro ao atualizar Key Result: ${error.message}`);
    }
  
    return data;
}
 

/**
 * Exclui um Key Result específico.
 * @param keyResultId - ID do Key Result que será deletado.
 */
export async function deleteKeyResult(keyResultId: string) {
  if (!keyResultId) {
    throw new Error('ID do Key Result é obrigatório para excluir.');
  }

  const { error } = await supabase
    .from('key_results')
    .delete()
    .eq('id', keyResultId);

  if (error) {
    throw new Error(`Erro ao excluir Key Result: ${error.message}`);
  }
}


export async function createManualOKR(cycleId: string) {
  try {
    const { userId, organizationId } = useAuthStore.getState();

    if (!userId || !organizationId) {
      throw new Error('Usuário ou organização não autenticados');
    }

    const newOKR = {
      cycle_id: cycleId,
      organization_id: organizationId,
      context: '',
      objective: '',
      type: 'operational',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('okrs')
      .insert([newOKR])
      .select('id, objective, type, status, cycle_id, user_id, organization_id, context, created_at, updated_at')
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Erro ao criar OKR:', error);
    throw error;
  }
}
