import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { updateOKR as updateOKRService } from '../services/okrService'; 
import { deleteOKR as deleteOKRService } from '../services/okrService';
import { toast } from 'react-hot-toast';


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
  deleteOKRLink 
} from '../services/okrService';

export const useOKRStore = create((set, get) => ({
  // Estado
  cycles: [],
  okrs: [],
  keyResults: [],
  links: [], 
  loading: false,
  error: null,
  selectedCycleId: null,
  expandedIds: [],


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
        return { ...okr, keyResults };
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


toggleExpand: (okrId: string) => set((state) => ({
  expandedIds: state.expandedIds.includes(okrId)
    ? state.expandedIds.filter(id => id !== okrId)
    : [...state.expandedIds, okrId]
})),

addOKR: (okr) => set((state) => ({
  okrs: [...state.okrs, okr],
}))
}));
