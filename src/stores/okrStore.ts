import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { updateOKR as updateOKRService } from '../services/okrService'; 
import { deleteOKR as deleteOKRService } from '../services/okrService';
import { useAuthStore } from './authStore'; 
import OpenAI from 'openai';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { logKaiPrompt } from '../lib/ai/logKaiPrompt';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // ou chave fixa se for teste
  dangerouslyAllowBrowser: true,
});

import { 
  fetchKeyResults, 
  createKeyResults as createKeyResultsService, 
  updateKeyResult as updateKeyResultService, 
  deleteKeyResult as deleteKeyResultService 
} from '../services/okrService';

import { 
  createOKR, 
  createKeyResults, 
  createInitialCheckins, 
  fetchOKRs, 
  fetchKeyResults,
  fetchOKRLinks,
  createOKRLink,
  deleteOKRLink,
  fetchKRTeamLinks,
  fetchTeams 
} from '../services/okrService';

export const useOKRStore = create((set, get) => ({
  // Estado
  cycles: [],
  okrs: [],
  keyResults: [],
  links: [], 
  teams: [],
  loading: false,
  error: null,
  selectedCycleId: null,
  expandedIds: [],
  context: '',
  setContext: (value: string) => set({ context: value }),
  isGenerating: false,
  setIsGenerating: (val: boolean) => set({ isGenerating: val }),

  // Novo estado de expandido
  expandedOKRs: new Set(),

  // Ações
  toggleExpandOKR: (okrId: string) => set((state) => {
    const newSet = new Set(state.expandedOKRs);
    if (newSet.has(okrId)) {
      newSet.delete(okrId);
    } else {
      newSet.add(okrId);
    }
    return { expandedOKRs: newSet };
  }),

  // Ações
  setSelectedCycleId: (cycleId) => set({ selectedCycleId: cycleId }),

  createCompleteOKR: async (context) => {
    set({ loading: true });
  
    try {
      const { objective, type, cycle_id, organization_id, user_id } = context.okr;
  
      // Mapeamento dos campos para o formato exigido pelo service
      const okrId = await createOKR({
        objective,
        type,
        cycleId: cycle_id,
        organizationId: organization_id,
        createdBy: user_id
      });
  
      const keyResultsData = await createKeyResults(context.keyResults, okrId);
      await linkOkrs(context.links, okrId);
      await createInitialCheckins(okrId, keyResultsData);
  
      // Depois de criar, recarrega os OKRs do ciclo/organização
      await get().loadOKRs(organization_id, cycle_id);
  
      set({ loading: false });
    } catch (error) {
      console.error('[❌ Erro em createCompleteOKR]', error);
      set({ error: error.message, loading: false });
    }
  },

  loadCycles: async (organizationId: string) => {
    set({ loading: true });
    console.log('[🛠️] Carregando ciclos para organizationId:', organizationId);
    try {
      const { data, error } = await supabase
        .from('okr_cycles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: true });

      console.log('[📦] Retorno do Supabase ciclos:', data, error);

      if (error) {
        throw new Error(`Erro ao buscar ciclos: ${error.message}`);
      }

      set({ cycles: data || [], loading: false });
    } catch (error) {
      console.error('[❌ Erro ao carregar ciclos]', error);
      set({ error: error.message, loading: false });
    }
  },

  loadOKRs: async (organizationId, cycleId = null) => {
    set({ loading: true });
  
    try {
      const okrs = await fetchOKRs(organizationId, cycleId);
  
      const okrsWithKRs = await Promise.all(okrs.map(async (okr) => {
        const keyResults = await fetchKeyResults(okr.id);
      
        // 🔽 Novo trecho: enriquecendo com team_ids
        const krIds = keyResults.map(kr => kr.id);
        const teamLinks = krIds.length > 0 ? await fetchKRTeamLinks(krIds) : [];
      
        const keyResultsWithTeams = keyResults.map(kr => ({
          ...kr,
          team_ids: teamLinks
            .filter(link => link.key_result_id === kr.id)
            .map(link => link.team_id)
        }));
      
        return { ...okr, keyResults: keyResultsWithTeams };
      }));
  
      set({ okrs: okrsWithKRs, loading: false });
      console.log('[🧠 set okrs]', okrsWithKRs);
    } catch (error) {
      console.error('[❌] Erro ao carregar OKRs e seus KRs:', error);
      set({ error: error.message, loading: false });
    }
  },

  loadAllOKRs: async (organizationId) => {
    if (!organizationId) {
      console.warn('[❌] Organização não definida.');
      return;
    }
  
    const { data: okrs, error: okrError } = await supabase
      .from('okrs')
      .select('*')
      .eq('organization_id', organizationId);
  
    if (okrError || !okrs?.length) {
      console.error('[❌] Erro ao buscar OKRs:', okrError?.message);
      set({ allOkrs: [] });
      return;
    }
  
    const okrIds = okrs.map(o => o.id);
  
    const { data: keyResults, error: krError } = await supabase
      .from('key_results')
      .select('*')
      .in('okr_id', okrIds);
  
    if (krError) {
      console.error('[❌] Erro ao buscar Key Results:', krError.message);
    }
  
    const okrsWithKRs = okrs.map(okr => ({
      ...okr,
      keyResults: keyResults?.filter(kr => kr.okr_id === okr.id) ?? [],
    }));
  
    console.log('[✅ allOkrs com KRs]', okrsWithKRs);
    set({ allOkrs: okrsWithKRs });
  },  

  updateOKR: async (okrId, updates) => {
    const updatedOKR = await updateOKRService(okrId, updates);
    
    set((state) => ({
      okrs: state.okrs.map((okr) =>
        okr.id === okrId ? { ...okr, ...updates } : okr
      ),
    }));
    
    toast.success('Objetivo atualizado!');
    
    return updatedOKR;
  },

  deleteOKR: async (okrId) => {
    await deleteOKRService(okrId);
    set((state) => ({
      okrs: state.okrs.filter((okr) => okr.id !== okrId),
    }));
  },

  loadKeyResults: async (okrId) => {
    set({ loading: true });
    try {
      const keyResults = await fetchKeyResults(okrId);
  
      set((state) => ({
        keyResults: [
          ...state.keyResults.filter((kr) => kr.okr_id !== okrId), // remove anteriores desse OKR
          ...keyResults, // adiciona os novos
        ],
        loading: false,
      }));
    } catch (error) {
      console.error(error);
      set({ error: error.message, loading: false });
    }
  },
  
  createKeyResults: async (keyResultsData, okrId) => {
    const newKeyResults = await createKeyResultsService(keyResultsData, okrId);
  
    if (newKeyResults && newKeyResults.length > 0) {
      set((state) => ({
        keyResults: [
          ...state.keyResults,
          ...newKeyResults
        ],
        okrs: state.okrs.map((okr) =>
          okr.id === okrId
            ? {
                ...okr,
                keyResults: [...(okr.keyResults || []), ...newKeyResults],
              }
            : okr
        ),
      }));
    }
  },

  updateKeyResult: async (keyResultId, updates) => {
    try {
      const updatedKeyResult = await updateKeyResultService(keyResultId, updates);
  
      set((state) => ({
        keyResults: state.keyResults.map((kr) =>
          kr.id === keyResultId ? { ...kr, ...updates } : kr
        ),
        okrs: state.okrs.map((okr) => {
          if (!okr.keyResults?.some((kr) => kr.id === keyResultId)) {
            return okr; // Mantém o mesmo OKR se não mudou
          }
          return {
            ...okr,
            keyResults: okr.keyResults.map((kr) =>
              kr.id === keyResultId ? { ...kr, ...updates } : kr
            ),
          };
        }),
      }));
      
      toast.success('Key Result atualizado!');
  
    } catch (error) {
      console.error(error);
      set({ error: error.message });
    }
  },

  deleteKeyResult: async (keyResultId) => {
    try {
      await deleteKeyResultService(keyResultId); // remove do banco
  
      set((state) => ({
        keyResults: state.keyResults.filter((kr) => kr.id !== keyResultId),
        okrs: state.okrs.map((okr) => ({
          ...okr,
          keyResults: (okr.keyResults || []).filter((kr) => kr.id !== keyResultId),
        })),
      }));
    } catch (error) {
      console.error('Erro ao excluir Key Result:', error);
      set({ error: error.message });
    }
  },

  fetchLinks: async (organizationId) => {
    try {
      const links = await fetchOKRLinks(organizationId);
      set({ links });
    } catch (error) {
      console.error('Erro ao buscar links de OKRs:', error);
      set({ error });
    }
  },
  
  createLink: async (sourceOkrId, targetOkrId, type = 'dependency') => {
    try {
      const newLink = await createOKRLink(sourceOkrId, targetOkrId, type);
      set({ links: [...get().links, newLink] });
    } catch (error) {
      console.error('Erro ao criar link de OKRs:', error);
      set({ error });
    }
  },
  
  deleteLink: async (linkId) => {
    try {
      await deleteOKRLink(linkId);
      const updatedLinks = get().links.filter(link => link.id !== linkId);
      set({ links: updatedLinks });
    } catch (error) {
      console.error('Erro ao deletar link de OKRs:', error);
      set({ error });
    }
  },


// Times
loadTeams: async (organizationId) => {
  try {
    const teams = await fetchTeams(organizationId);
    set({ teams });
  } catch (error) {
    console.error('[❌ Erro ao carregar teams]', error);
    set({ error: error.message });
  }
},

//Acompanhamento

getCycleAverageProgress: (cycleId) => {
  const okrs = get().okrs.filter(o => o.cycle_id === cycleId);
  if (!okrs.length) return 0;

  const total = okrs.reduce((okrSum, okr) => {
    const krList = Array.isArray(okr.keyResults) ? okr.keyResults : [];
    const krSum = krList.reduce((sum, kr) => sum + (kr.progress ?? 0), 0);
    const krAvg = krList.length > 0 ? krSum / krList.length : 0;
    return okrSum + krAvg;
  }, 0);

  return Math.round(total / okrs.length);
},


//KAI Generator

generateFullOKRStructure: async (prompt: string) => {
  const { userId, organizationId } = useAuthStore.getState();
  
  const dataAtual = new Date();

  const dataAtualFormatada = dataAtual.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace('.', '');
  console.log(dataAtualFormatada);

  const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  response_format: 'json',
  messages: [
    {
      role: 'system',
      content: `
Você é a Kai, uma IA especialista em OKRs.

Você receberá abaixo um TEXTO JÁ VALIDADO PELO USUÁRIO contendo a estrutura final de OKRs aprovada por ele.

⚠️ Sua única tarefa é CONVERTER esse conteúdo em formato JSON, seguindo a estrutura abaixo, sem alterar absolutamente nada.

🚫 Não reformule textos, não reorganize, não corrija frases.
✅ Apenas converta fielmente o conteúdo textual em estrutura JSON.

Formato JSON esperado:
{
  "ciclo": {
    "nome": "string",
    "dataInicio": "YYYY-MM-DD",
    "dataFim": "YYYY-MM-DD",
    "temaEstratégico": "string"
  },
  "okrs": [
    {
      "id": "okr-1",
      "objetivo": "string",
      "tipo": "strategic" | "tactical" | "operational",
      "resultadosChave": [
        {
          "texto": "string",
          "tipo": "moonshot" | "roofshot",
          "métrica": "string",
          "valorInicial": number,
          "valorAlvo": number,
          "unidade": "string"
        }
      ]
    }
  ],
  "links": [
    {
      "origem": "okr-1",
      "destino": "okr-2",
      "tipo": "hierarchy"
    }
  ]
}

Retorne APENAS o JSON sem comentários ou explicações.

Texto validado:
"""
${prompt}
"""
`.trim()
    }
  ]
});

  const raw = completion.choices[0].message.content;
  const totalTokens = completion.usage?.total_tokens ?? 0;


  const hoje = new Date();
  const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;

  if (organizationId && totalTokens > 0) {
    const { data: rowExistente, error: erroExistente } = await supabase
      .from('usage_tokens')
      .select('id, tokens_utilizados')
      .eq('account_id', organizationId)
      .eq('mes_referencia', mesReferencia)
      .maybeSingle();
  
    if (erroExistente) {
      console.warn('[❌ Erro ao verificar uso existente]', erroExistente);
    }
  
    if (rowExistente) {
      await supabase
        .from('usage_tokens')
        .update({
          tokens_utilizados: rowExistente.tokens_utilizados + totalTokens
        })
        .eq('id', rowExistente.id);
    } else {
      await supabase.rpc('criar_usage_tokens', {
        p_account_id: organizationId,
        p_mes: mesReferencia,
        p_tokens: totalTokens
      });
    }
  
    console.log('[🔢 Tokens registrados com sucesso]', {
      organizationId,
      mesReferencia,
      totalTokens
    });
  }

  if (!raw) throw new Error('Resposta da IA veio vazia');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('[❌ Erro ao fazer parse do JSON da IA]', err, raw);
    throw new Error('Erro ao interpretar resposta da IA');
  }

  if (!parsed?.ciclo || !Array.isArray(parsed.okrs) || !Array.isArray(parsed.links)) {
    console.error('[❌ Estrutura inesperada da IA]', parsed);
    throw new Error('A estrutura retornada pela IA não está no formato esperado.');
  }
  
  const { ciclo, okrs, links } = parsed;

  await logKaiPrompt(prompt, ciclo.temaEstratégico);

  if (Array.isArray(parsed.ciclo)) {
    throw new Error('A IA gerou múltiplos ciclos. Refine o prompt para gerar apenas um ciclo por vez.');
  }

  if (okrs.length > 20) {
    throw new Error('Foram gerados muitos OKRs. Refine o prompt para limitar a quantidade.');
  }
  
  const totalKRs = okrs.reduce((acc, o) => acc + (o.resultadosChave?.length || 0), 0);
  if (totalKRs > 60) {
    throw new Error('A IA gerou um volume excessivo de Key Results. Tente um prompt mais focado.');
  }

  // Verifica e ajusta datas do ciclo se necessário
  const existingCycles = get().cycles;
  const latestCycle = existingCycles.length > 0
    ? existingCycles.reduce((prev, curr) => {
        if (!prev?.end_date || !curr?.end_date) return prev;
        return new Date(prev.end_date) > new Date(curr.end_date) ? prev : curr;
      })
    : null;

  const dataInicioGerado = new Date(`${ciclo.dataInicio}T00:00:00`);
  const precisaAjustar = !ciclo.dataInicio || dataInicioGerado <= hoje;

  if (precisaAjustar) {
    const novaDataInicio = latestCycle?.end_date
      ? new Date(`${latestCycle.end_date}T00:00:00`)
      : new Date();
    novaDataInicio.setDate(novaDataInicio.getDate() + 1);

    const novaDataFim = new Date(novaDataInicio);
    novaDataFim.setMonth(novaDataInicio.getMonth() + 3);

    ciclo.dataInicio = novaDataInicio.toISOString().split('T')[0];
    ciclo.dataFim = novaDataFim.toISOString().split('T')[0];

    console.log('[✅ Datas ajustadas automaticamente]', {
      dataInicio: ciclo.dataInicio,
      dataFim: ciclo.dataFim,
    });
  }

  // 1. Cria ciclo
  const { data: cicloCriado, error: erroCiclo } = await supabase
    .from('okr_cycles')
    .insert({
      name: ciclo.nome,
      start_date: ciclo.dataInicio,
      end_date: ciclo.dataFim,
      strategic_theme: ciclo.temaEstratégico,
      user_id: userId,
      organization_id: organizationId,
    })
    .select('id')
    .single();

  if (erroCiclo) throw erroCiclo;

  const cicloId = cicloCriado.id;

  // 2. Cria OKRs
  for (const okr of okrs) {
    const { data: okrCriado, error: erroOKR } = await supabase
      .from('okrs')
      .insert({
        cycle_id: cicloId,
        user_id: userId,
        organization_id: organizationId,
        objective: okr.objetivo,
        type: okr.tipo,
        status: 'active',
      })
      .select('id')
      .single();

    if (erroOKR) throw erroOKR;

    // 3. Cria KRs com estrutura completa
    const krPayload = okr.resultadosChave.map((kr: any) => ({
      okr_id: okrCriado.id,
      text: kr.texto,
      kr_type: kr.tipo,
      metric: kr.métrica || null,
      initial_value: kr.valorInicial ?? null,
      target_value: kr.valorAlvo ?? null,
      unit: kr.unidade || null,
      user_id: userId,
      status: 'active',
    }));

    const { error: erroKRs } = await supabase.from('key_results').insert(krPayload);
    if (erroKRs) throw erroKRs;

    // Marca ID
    okr._generatedId = okrCriado.id;
  }

  // 4. Cria vínculos com regras de hierarquia
  for (const link of links) {
    const sourceOkr = okrs.find((o) => o.id === link.origem);
    const targetOkr = okrs.find((o) => o.id === link.destino);

    const source = sourceOkr?._generatedId;
    const target = targetOkr?._generatedId;

    if (!source || !target) continue;

    const from = sourceOkr?.tipo;
    const to = targetOkr?.tipo;

    // Regras válidas de hierarquia
    const hierarquiasValidas = [
      ['strategic', 'tactical'],
      ['tactical', 'operational'],
      ['operational', 'tactical'],
      ['tactical', 'strategic'],
    ];

    const isValido = hierarquiasValidas.some(
      ([origem, destino]) => origem === from && destino === to
    );

    if (!isValido) {
      console.warn('[⚠️ Vínculo ignorado por hierarquia inválida]', { from, to });
      continue;
    }

    // Mapeia tipo
    let tipoLink = 'strategic_to_tactical';
    if (from === 'strategic' && to === 'tactical') tipoLink = 'strategic_to_tactical';
    else if (from === 'tactical' && to === 'operational') tipoLink = 'tactical_to_operational';
    else if (from === 'operational' && to === 'tactical') tipoLink = 'operational_to_tactical';
    else if (from === 'tactical' && to === 'strategic') tipoLink = 'tactical_to_strategic';

    await supabase.from('okr_links').insert({
      source_okr_id: source,
      target_okr_id: target,
      link_type: tipoLink,
    });
  }


  await get().loadCycles(organizationId);
  await get().loadOKRs(organizationId, cicloId);
  await get().fetchLinks(organizationId);

  // Após carregar os OKRs
  const novosIds = okrs.map(o => o._generatedId).filter(Boolean);
  set((state) => ({
    expandedIds: [...new Set([...state.expandedIds, ...novosIds])]
  }));

  return cicloId;
},


toggleExpand: (okrId: string) => set((state) => ({
  expandedIds: state.expandedIds.includes(okrId)
    ? state.expandedIds.filter(id => id !== okrId)
    : [...state.expandedIds, okrId]
})),

addOKR: (okr) => set((state) => ({
  okrs: [...state.okrs, okr],
}))
}));
