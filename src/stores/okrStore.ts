import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useModalStore } from './modalStore';
import { mockOKRs, mockLinks } from '../lib/mockData';
import toast from 'react-hot-toast';
import { getUserId } from '../lib/utils';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // ou chave fixa se for teste
  dangerouslyAllowBrowser: true,
});

interface OKRState {
  cycles: any[];
  okrs: any[];
  keyResults: any[];
  loading: boolean;
  error: string | null;
  links: any[];
  
  selectedCycleId: string | null;
  setSelectedCycleId: (cycleId: string | null) => void; 
  
  fetchCycles: () => Promise<void>;
  createCycle: (cycleData: any) => Promise<void>;
  updateCycle: (cycleId: string, updates: any) => Promise<void>;
  deleteCycle: (cycleId: string) => Promise<void>;
  fetchOKRs: (cycleId: string) => Promise<void>;
  createOKR: (cycleId: string, generatedOKR: GeneratedOKR) => Promise<void>;
  updateOKR: (okrId: string, updates: Partial<any>) => Promise<void>;
  updateKeyResult: (krId: string, updates: Partial<any>) => Promise<void>;
  deleteKeyResult: (krId: string, okrId: string) => Promise<void>;
  deleteOKR: (okrId: string) => Promise<void>;
  createKeyResult: (okrId: string) => Promise<void>;
  fetchLinks: () => Promise<void>;
  createLink: (sourceId: string, targetOkrId: string, linkType: string) => Promise<void>;
  deleteLink: (linkId: string) => Promise<void>;
}

export const useOKRStore = create<OKRState>((set, get) => ({
  cycles: [],
  okrs: [],
  keyResults: [],
  loading: false,
  error: null,
  links: [],
  selectedCycleId: null,

 setSelectedCycleId: (cycleId: string | null) => set({ selectedCycleId: cycleId }),

  fetchCycles: async () => {
    set({ loading: true });
    console.log('[🌀 Buscando ciclos da view...]');
  
    function calculateStatus(start: string, end: string): 'draft' | 'active' | 'completed' {
      if (!start || !end) {
        console.warn('[⚠️ Datas ausentes no ciclo]', { start, end });
        return 'draft';
      }
  
      const startDate = new Date(`${start}T00:00:00`);
      const endDate = new Date(`${end}T23:59:59`);
      const today = new Date();
  
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('[⚠️ Datas inválidas no ciclo]', { start, end });
        return 'draft';
      }
  
      if (today < startDate) return 'draft';
      if (today > endDate) return 'completed';
      return 'active';
    }
  
    try {
      const { data: rawCycles, error } = await supabase
        .from('vw_okr_cycles')
        .select(`
          id,
          name,
          start_date_text,
          end_date_text,
          strategic_theme,
          user_id,
          status
        `)
        .order('start_date_text', { ascending: false });
  
      if (error) {
        console.error('[❌ Erro ao buscar ciclos]', error);
        throw error;
      }
  
      const cycles = rawCycles.map(cycle => ({
        ...cycle,
        status: calculateStatus(cycle.start_date_text, cycle.end_date_text)
      }));
  
      console.log('[✅ Ciclos carregados da view]', cycles);
      set({ cycles, loading: false });
    } catch (error) {
      console.error('[❌ Erro no catch do fetchCycles]', error);
      set({ error: (error as Error).message, loading: false });
    }
  },


  fetchAllOKRs: async () => {
  console.log('[📦 Buscando TODOS os OKRs de todos os ciclos]');
  const { data, error } = await supabase
    .from('okrs')
    .select(`
      id, objective, type, status, cycle_id, user_id, created_at, updated_at,
      key_results (
        id, okr_id, text, metric, initial_value, current_value, target_value, unit, progress, kr_type, status, user_id
      )
    `); // ✅ EXPLÍCITO

  if (error) {
    console.error('[❌ Erro ao buscar todos os OKRs]', error);
    return;
  }

  set({ allOkrs: data });
  console.log('[✅ allOkrs carregados]', data);
},


  createCycle: async (cycleData) => {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('okr_cycles')
      .insert({ ...cycleData, user_id: userId })
      .select('id')
      .single(); // retorna apenas o objeto inserido

    if (error) throw error;

    return data.id; // agora retorna o ID
  } catch (error) {
    set({ error: (error as Error).message });
    throw error;
  }
},


  updateCycle: async (cycleId, updates) => {
    try {
      const { error } = await supabase
        .from('okr_cycles')
        .update(updates)
        .eq('id', cycleId);

      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteCycle: async (cycleId) => {
    try {
      const { error } = await supabase
        .from('okr_cycles')
        .delete()
        .eq('id', cycleId);

      if (error) throw error;

      const { cycles } = get();
      set({ cycles: cycles.filter(cycle => cycle.id !== cycleId) });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

 fetchOKRs: async (cycleId: string) => {
  set({ loading: true });
  try {
    const { data: okrs, error: okrsError } = await supabase
      .from('okrs')
      .select(`
        id, objective, type, status, cycle_id, user_id, context, created_at, updated_at,
        key_results (
          id, okr_id, text, metric, initial_value, current_value, target_value, unit, progress, kr_type, status, user_id, confidence_flag,
          key_result_checkins (
            id, key_result_id, user_id, date, confidence_flag, progress, created_at
          )
        )
      `)
      .eq('cycle_id', cycleId)
      .order('created_at', { ascending: false });

    if (okrsError) throw okrsError;

    // Normaliza os OKRs com os KRs embutidos, já mapeando checkins:
    const normalized = okrs.map((okr) => ({
      ...okr,
      keyResults: (okr.key_results ?? []).map((kr: any) => ({
        ...kr,
        checkins: kr.key_result_checkins ?? [],
      })),
    }));

    // Extrai todos os KRs e anexa o cycle_id herdado do OKR pai
    const allKRs = normalized.flatMap((okr) =>
      (okr.keyResults || []).map((kr) => ({
        ...kr,
        cycle_id: okr.cycle_id,
      }))
    );

    set({
      okrs: normalized,
      keyResults: allKRs,
      loading: false,
    });

  } catch (error) {
    set({ error: (error as Error).message, loading: false });
  }
},
 

  createOKR: async (cycleId: string, generatedOKR: GeneratedOKR) => {
  set({ loading: true });
  const validTypes = ['strategic', 'tactical', 'operational'];
  if (!validTypes.includes(generatedOKR.type)) {
    generatedOKR.type = 'tactical';
  }

  try {
    const userId = await getUserId();

    const { data: okr, error: okrError } = await supabase
      .from('okrs')
      .insert({
        cycle_id: cycleId,
        objective: generatedOKR.objective,
        type: generatedOKR.type,
        status: 'active',
        user_id: userId,
      })
      .select()
      .single();

    if (okrError) throw okrError;

    const keyResultsData = generatedOKR.keyResults.map(kr => ({
      okr_id: okr.id,
      text: kr.text,
      metric: kr.metric,
      initial_value: kr.initialValue,
      target_value: kr.targetValue,
      unit: kr.unit,
      status: 'active',
      user_id: userId,
    }));

    const { error: krError } = await supabase
      .from('key_results')
      .insert(keyResultsData);

    if (krError) throw krError;

    await get().fetchOKRs(cycleId);
    set({ loading: false });
  } catch (error) {
    set({ error: (error as Error).message, loading: false });
  }
},

generateFullOKRStructure: async (prompt: string) => {
  const userId = await getUserId();

  const dataAtual = new Date();

  const dataAtualFormatada = dataAtual.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace('.', '');
  console.log(dataAtualFormatada);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
        Você é do sexo feminino e se chama Key e é uma geradora de OKRs estruturados. Com base no contexto fornecido, você deve retornar:

        🟦 ITEM ZERO: Sempre utilize a data atual como referência temporal para nomes e datas relativas. 
        A data de hoje é: **${dataAtualFormatada}**

        -Exemplos de aplicação:
          - Se um ciclo começa em abril de 2025, seu nome correto é “Trimestre 2 de 2025”.
          - Não use anos anteriores como padrão (ex: “Trimestre 1 de 2024”) a menos que estejam claramente no contexto do usuário.
        - Essa data deve ser usada como base para interpretar, classificar e nomear ciclos ou períodos.

        1. Um ciclo (com nome, data de início, data de fim e tema)
        
        2. De 3 a 6 objetivos, sendo obrigatoriamente:
          - Pelo menos 1 estratégico
          - Pelo menos 1 tático
          - Pelo menos 1 operacional
        
        3. De 2 a 4 resultados-chave por objetivo
           3.1. Sempre inclua os campos: texto, tipo, métrica
           3.2. A métrica deve sempre começar com letra maiúscula
           3.3. Nunca traga os campos de Valor Inicial, Atual e Alvo preenchidos
        
        4. Um conjunto de vínculos válidos entre os objetivos, com base na hierarquia:
           - Estratégico ➝ Tático ➝ Operacional
           - **Todos os objetivos operacionais DEVEM estar vinculados a um objetivo tático**
           - **Todos os objetivos táticos DEVEM estar vinculados a um objetivo estratégico**
           - Nunca vincule diretamente um objetivo estratégico a um operacional
           - Nenhum objetivo deve ficar sem vínculo
        
        🔷 GERE O CONTEÚDO SEMPRE EM PORTUGUÊS BRASILEIRO

        5. Se encontrar quantidades de Objetivos e KRs mencionados você DEVE respeitar:
          - Exemplo 1: 2 Objetivos Estratégicos, 3 Táticos e 5 Operacionais
          - Exemplo 2: 2 Objetivos Estratégicos com 2 KRs cada
          - Exemplo 3: 3 Objetivos Táticos com 3 KRs cada 
        ---
        
        🎯 Objetivos Devem ser:
        
        - Qualitativos: Não devem conter números, apenas descrever o que se quer alcançar.
        - Inspiradores, aspiracionais e claros
        - Sempre alinhados ao tema estratégico do ciclo
        
        📈 Key Results Devem ser:
        
        - Mensuráveis e orientados a resultado (não tarefas)
        - Relevantes e desafiadores, porém alcançáveis
        - Para objetivos estratégicos e táticos: 2 a 3 KRs
        - Para objetivos operacionais: 2 a 5 KRs
        
        ---

        🔷 Formato JSON esperado:
        
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
        `
      },
      {
        role: 'user',
        content: `Contexto: ${prompt}`
      }
    ]
  });

  const raw = completion.choices[0].message.content;
  if (!raw) throw new Error('Resposta da IA veio vazia');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('[❌ Erro ao fazer parse do JSON da IA]', err, raw);
    throw new Error('Erro ao interpretar resposta da IA');
  }

  const { ciclo, okrs, links } = parsed;

  // Verifica e ajusta datas do ciclo se necessário
  const hoje = new Date();
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

  // Atualiza estado da store
  await get().fetchCycles();
  await get().fetchOKRs(cicloId);
  await get().fetchLinks();

  return cicloId;
},

  createManualOKR: async (cycleId: string) => {
  try {
    const userId = await getUserId();
    const newOKR = {
      cycle_id: cycleId,
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
    .select('id, objective, type, status, cycle_id, user_id, context, created_at, updated_at') // ✅ seguro
    .single();


    if (error) throw error;

    set((state) => ({
      okrs: [...state.okrs, data],
    }));
  } catch (error) {
    set({ error: (error as Error).message });
    throw error;
  }
},
  
  updateOKR: async (okrId: string, updates: Partial<any>) => {
    const validTypes = ['strategic', 'tactical', 'operational']; // Tipos válidos
  
    // Verificar se o tipo está nos updates e se é válido
    if (updates.type && !validTypes.includes(updates.type)) {
      updates.type = 'tactical'; // Ajuste para tipo padrão caso seja inválido
      console.warn(`Tipo inválido fornecido: '${updates.type}', ajustando para 'tactical'.`);
    }
  
    try {
      const { error } = await supabase
        .from('okrs')
        .update(updates)
        .eq('id', okrId);
  
      if (error) throw error;
  
      const { data: updatedOKR } = await supabase
      .from('okrs')
      .select(`
        id, objective, type, status, cycle_id, user_id, context, created_at, updated_at,
        key_results (
          id, okr_id, text, metric, initial_value, current_value, target_value, unit, progress, kr_type, status, user_id
        )
      `)
      .eq('id', okrId)
      .single();

  
      if (updatedOKR) {
        const { okrs } = get();
        const updatedOkrs = okrs.map(okr =>
          okr.id === okrId ? { ...updatedOKR, keyResults: updatedOKR.key_results } : okr
        );
        set({ okrs: updatedOkrs });
      }
    } catch (error) {
      useModalStore.getState().showModal({
        type: 'error',
        title: 'Erro ao atualizar OKR',
        message: 'Ocorreu um erro ao atualizar o OKR. Por favor, tente novamente.'
      });
    }
  },

  updateKeyResult: async (krId: string, updates: Partial<any>) => {
    try {
      const { data: updatedKR, error } = await supabase
        .from('key_results')
        .update(updates)
        .eq('id', krId)
        .select(`
          id, okr_id, text, metric, initial_value, current_value, target_value, unit, progress, kr_type, status, user_id, confidence_flag
        `)
        .single();
  
      if (error) throw error;
  
      if (updatedKR) {
        const { okrs } = get();
        const updatedOkrs = okrs.map(okr => ({
          ...okr,
          keyResults: okr.keyResults.map((kr: any) =>
            kr.id === krId ? updatedKR : kr
          )
        }));
        set({ okrs: updatedOkrs });
      }
    } catch (error) {
      useModalStore.getState().showModal({
        type: 'error',
        title: 'Erro ao atualizar Resultado-Chave',
        message: 'Ocorreu um erro ao atualizar o resultado-chave. Por favor, tente novamente.'
      });
    }
  },


  deleteKeyResult: async (krId: string, okrId: string) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .delete()
        .eq('id', krId);

      if (error) throw error;

      const { okrs } = get();
      const updatedOkrs = okrs.map(okr => {
        if (okr.id === okrId) {
          return {
            ...okr,
            keyResults: okr.keyResults.filter((kr: any) => kr.id !== krId)
          };
        }
        return okr;
      });
      set({ okrs: updatedOkrs });

      useModalStore.getState().showModal({
        type: 'success',
        title: 'Sucesso',
        message: 'Resultado-chave excluído com sucesso!'
      });
    } catch (error) {
      useModalStore.getState().showModal({
        type: 'error',
        title: 'Erro ao excluir',
        message: 'Ocorreu um erro ao excluir o resultado-chave. Por favor, tente novamente.'
      });
    }
  },

  updateKeyResultConfidence: async (krId: string, confidenceFlag: 'green' | 'yellow' | 'red' | null) => {
  const { error } = await supabase
    .from('key_results')
    .update({ confidence_flag: confidenceFlag })
    .eq('id', krId);

  if (error) {
    console.error('[❌ Erro ao atualizar flag de confiança]', error);
    return;
  }

  // atualiza localmente
  set((state) => {
    const updated = state.okrs.map((okr) => ({
      ...okr,
      keyResults: okr.keyResults.map((kr) =>
        kr.id === krId ? { ...kr, confidence_flag: confidenceFlag } : kr
      ),
    }));
    return { okrs: updated };
  });
},

  deleteOKR: async (okrId: string) => {
    try {
      const { error } = await supabase
        .from('okrs')
        .delete()
        .eq('id', okrId);

      if (error) throw error;

      const { okrs } = get();
      set({ okrs: okrs.filter(okr => okr.id !== okrId) });

      useModalStore.getState().showModal({
        type: 'success',
        title: 'Sucesso',
        message: 'OKR excluído com sucesso!'
      });
    } catch (error) {
      useModalStore.getState().showModal({
        type: 'error',
        title: 'Erro ao excluir',
        message: 'Ocorreu um erro ao excluir o OKR. Por favor, tente novamente.'
      });
    }
  },

 createKeyResult: async (okrId: string) => {
  try {
    const userId = await getUserId();

    const { data: keyResult, error } = await supabase
    .from('key_results')
    .insert({
      okr_id: okrId,
      text: '',
      kr_type: 'roofshot',
      metric: '',
      initial_value: 0,
      target_value: 0,
      unit: '',
      status: 'active',
      progress: 0,
      user_id: userId,
    })
    .select('id, okr_id, text, metric, initial_value, current_value, target_value, unit, progress, kr_type, status, user_id')
    .single();


    if (error) throw error;

    const { okrs, updateOKR } = get();
    const updatedOkrs = okrs.map(okr => {
      if (okr.id === okrId) {
        const updatedOKR = {
          ...okr,
          keyResults: [...(okr.keyResults ?? []), keyResult],
        };

        if (updatedOKR.status === 'draft' && updatedOKR.keyResults.length > 0) {
          updateOKR(updatedOKR.id, { status: 'active' });
          updatedOKR.status = 'active';
        }

        return updatedOKR;
      }
      return okr;
    });

    set({ okrs: updatedOkrs });
  } catch (error) {
    useModalStore.getState().showModal({
      type: 'error',
      title: 'Erro ao criar Resultado-Chave',
      message: 'Ocorreu um erro ao criar o novo resultado-chave. Por favor, tente novamente.'
    });
  }
},

  fetchLinks: async () => {
    try {
      const { data: links, error } = await supabase
        .from('okr_links')
        .select('*');

      if (error) throw error;
      set({ links: links ?? [] });
      
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  createLink: async (sourceId: string, targetOkrId: string, linkType: string) => {
    console.log('[🧠 linkType enviado ao Supabase]', {
        source_okr_id: sourceId,
        target_okr_id: targetOkrId,
        link_type: linkType,
        typeof_link_type: typeof linkType,
      });
    try {
      const { error } = await supabase
        .from('okr_links')
        .insert({
          source_okr_id: sourceId,
          target_okr_id: targetOkrId,
          link_type: linkType
        });

      if (error) throw error;
      await get().fetchLinks();
    } catch (error) {
      useModalStore.getState().showModal({
        type: 'error',
        title: 'Erro ao criar conexão',
        message: 'Ocorreu um erro ao criar a conexão entre os OKRs. Por favor, tente novamente.'
      });
    }
  },

  deleteLink: async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('okr_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      const { links } = get();
      set({ links: links.filter(link => link.id !== linkId) });
    } catch (error) {
      useModalStore.getState().showModal({
        type: 'error',
        title: 'Erro ao remover conexão',
        message: 'Ocorreu um erro ao remover a conexão. Por favor, tente novamente.'
      });
    }
  },

  //Dashboard Métricas

  getCycleAverageProgress: (cycleId) => {
    const { okrs } = get();
    const cycleOKRs = okrs.filter(okr => okr.cycle_id === cycleId);
    console.log('[📄 OKRs do ciclo]', cycleOKRs);
    const allKRs = cycleOKRs.flatMap(okr => okr.keyResults ?? []);
    console.log('[📊 KRs do ciclo]', allKRs);
  
    if (allKRs.length === 0) return 0;
  
    const total = allKRs.reduce((sum, kr) => sum + (kr.progress ?? 0), 0);
    return Math.round(total / allKRs.length);
  },

  getAverageProgressForAllCycles: () => {
    const { okrs, cycles } = get();
  
    return cycles.map(cycle => {
      const okrsDoCiclo = okrs.filter(okr => okr.cycle_id === cycle.id);
      const allKRs = okrsDoCiclo.flatMap(okr => okr.keyResults ?? []);
      const total = allKRs.reduce((sum, kr) => sum + (kr.progress ?? 0), 0);
      const avg = allKRs.length > 0 ? Math.round(total / allKRs.length) : 0;
  
      return {
        cycleId: cycle.id,
        name: cycle.name,
        progress: avg,
      };
    });
  },
  
}));