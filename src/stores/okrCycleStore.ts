import { create } from 'zustand';
import { 
  createCycle as createCycleService,  
  updateCycle, 
  fetchCycles, 
  deleteCycle 
} from '../services/okrCycleService';

export const useCycleStore = create((set, get) => ({
  // Estado
  cycles: [],
  loading: false,
  error: null,

  // Carregar ciclos da organização
  loadCycles: async (organizationId) => {
    if (!organizationId) {
      console.warn('[⚠️] loadCycles: organizationId ausente, não buscar ciclos.');
      return;
    }
    console.log('[📦] Buscando ciclos para organizationId:', organizationId);
    set({ loading: true });
    try {
      const cycles = await fetchCycles(organizationId);
      set({ cycles, loading: false });
    } catch (error) {
      console.error('[❌] Erro ao carregar ciclos:', error);
  
      // Só exibe erro de fato se for algo além de "ID da organização obrigatório"
      if (error.message !== 'ID da organização é obrigatório para buscar ciclos.') {
        set({ error: error.message, loading: false });
      } else {
        set({ loading: false });
      }
    }
  },

  // Criar novo ciclo
  createCycle: async (cycleData) => {
    set({ loading: true });
    try {
      console.log('[📦] user_id no createCycle:', cycleData.user_id);
      const newCycle = await createCycleService(cycleData); // chama o service corretamente
      set((state) => ({
        cycles: [...state.cycles, newCycle],
        loading: false,
      }));
      return newCycle.id; // <<<<<<< ✅ retorna o ID aqui
    } catch (error) {
      console.error(error);
      set({ error: error.message, loading: false });
      throw error; // opcionalmente repassa o erro
    }
  },

  // Atualizar ciclo existente
  updateCycle: async (cycleId, updates) => {
    set({ loading: true });
    try {
      const updatedCycle = await updateCycle(cycleId, updates);
      set((state) => ({
        cycles: state.cycles.map((cycle) => 
          cycle.id === cycleId ? updatedCycle : cycle
        ),
        loading: false
      }));
    } catch (error) {
      console.error(error);
      set({ error: error.message, loading: false });
    }
  },

  // Deletar ciclo
  deleteCycle: async (cycleId) => {
    set({ loading: true });
    try {
      await deleteCycle(cycleId);
      set((state) => ({
        cycles: state.cycles.filter((cycle) => cycle.id !== cycleId),
        loading: false
      }));
    } catch (error) {
      console.error(error);
      set({ error: error.message, loading: false });
    }
  }
}));
