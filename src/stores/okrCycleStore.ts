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
  selectedCycleId: null, // <-- ADICIONAR AQUI
  loading: false,
  loadingCycles: false,
  error: null,

  // Setter para ciclo selecionado
  setSelectedCycleId: (id) => set({ selectedCycleId: id }), // <-- ADICIONAR AQUI

  // Carregar ciclos da organização
  loadCycles: async (organizationId) => {

    console.group('[🧩 loadCycles]');
    console.log('organizationId recebido:', organizationId);
    console.trace();
    console.groupEnd();

    if (!organizationId) {
      console.warn('[⚠️] loadCycles: organizationId ausente, não buscar ciclos.');
      return;
    }

    set({ loadingCycles: true });

    try {
      const cycles = await fetchCycles(organizationId);
      
      console.log('[✅ loadCycles] Ciclos carregados:', cycles);
      
      set({ cycles, loadingCycles: false });

      return cycles;
    } catch (error) {
      console.error('[❌] Erro ao carregar ciclos:', error);
      if (error.message !== 'ID da organização é obrigatório para buscar ciclos.') {
        set({ error: error.message, loadingCycles: false });
      } else {
        set({ loadingCycles: false });
      }
    }
  },

  // Criar novo ciclo
  createCycle: async (cycleData) => {
    set({ loading: true });
    try {
      console.log('[📦] user_id no createCycle:', cycleData.user_id);
      const newCycle = await createCycleService(cycleData);
      set((state) => ({
        cycles: [...state.cycles, newCycle],
        loading: false,
      }));
      return newCycle.id;
    } catch (error) {
      console.error(error);
      set({ error: error.message, loading: false });
      throw error;
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
