import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface KRCheckin {
    kr_text: string;
    okr_type: 'strategic' | 'tactical' | 'operational';
    progress: number;
    checkins: Record<string, 'green' | 'yellow' | 'red' | null>;
  }
  
  interface DashboardState {
    placarData: KRCheckin[];
    allDates: string[];
    loadPlacarData: (organizationId: string, cycleId: string) => Promise<void>;
  }
  
  export const useDashboardStore = create<DashboardState>((set, get) => ({
    placarData: [],
    allDates: [],
  
    loadPlacarData: async (organizationId, cycleId) => {
      //console.log('[🔁] Carregando dados de placar...');
    
      // 1. Buscar as datas de check-in do ciclo
      const { data: checkinDatesRaw, error: checkinDatesError } = await supabase
        .from('okr_checkins')
        .select('checkin_date')
        .eq('cycle_id', cycleId);
    
      if (checkinDatesError) {
        console.error('Erro ao buscar okr_checkins', checkinDatesError);
        return;
      }
    
      const allDates = (checkinDatesRaw ?? [])
        .map((row) => row.checkin_date.split('T')[0])
        .sort();
    
      // 2. Buscar todos os OKRs do ciclo
      const { data: okrsRaw, error: okrsError } = await supabase
        .from('okrs')
        .select('id, type, cycle_id')
        .eq('cycle_id', cycleId);
    
      if (okrsError) {
        console.error('Erro ao buscar okrs', okrsError);
        return;
      }
    
      const okrMap = new Map(okrsRaw.map((okr) => [okr.id, okr]));
    
      // 3. Buscar todos os KRs
      const { data: keyResultsRaw, error: keyResultsError } = await supabase
        .from('key_results')
        .select('id, text, progress, okr_id');
    
      if (keyResultsError) {
        console.error('Erro ao buscar key_results', keyResultsError);
        return;
      }
    
      // 4. Filtrar apenas os KRs que pertencem ao ciclo atual
      const keyResults = keyResultsRaw.filter((kr) => {
        const okr = okrMap.get(kr.okr_id);
        return okr?.cycle_id === cycleId;
      });
    
      // 5. Buscar check-ins realizados nos KRs
      const { data: krCheckinsRaw, error: krCheckinsError } = await supabase
        .from('key_result_checkins')
        .select('key_result_id, date, confidence_flag')
        .in('key_result_id', keyResults.map((kr) => kr.id));
    
      if (krCheckinsError) {
        console.error('Erro ao buscar key_result_checkins', krCheckinsError);
        return;
      }
    
      const checkinMap = new Map<string, Record<string, 'green' | 'yellow' | 'red' | null>>();
    
      for (const checkin of krCheckinsRaw ?? []) {
        const date = checkin.date.split('T')[0];
        if (!checkinMap.has(checkin.key_result_id)) {
          checkinMap.set(checkin.key_result_id, {});
        }
        checkinMap.get(checkin.key_result_id)![date] = checkin.confidence_flag;
      }
    
      // 6. Montar placarData
      const placarData = keyResults.map((kr) => {
        const okr = okrMap.get(kr.okr_id);
        return {
          kr_text: kr.text,
          okr_type: okr?.type ?? 'operational',
          progress: kr.progress,
          checkins: checkinMap.get(kr.id) ?? {}
        };
      });
    
      //console.log('[✅ FINAL] placarData:', placarData);
      //console.log('[✅ FINAL] allDates:', allDates);
    
      set({ placarData, allDates });
    }
    

  }));
