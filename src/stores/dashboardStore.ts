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
        console.log('[🔥 VIEW] Carregando dados da view placar_checkins_completos');
      
        const { data, error } = await supabase
          .from('placar_checkins_completos')
          .select('*')
          .eq('cycle_id', cycleId);
      
        if (error) {
          console.error('[❌ Erro na view placar_checkins_completos]', error);
          return;
        }
      
        console.log('[✅ VIEW] Dados recebidos:', data);
      
        const grouped = new Map<string, {
          kr_text: string;
          okr_type: 'strategic' | 'tactical' | 'operational';
          progress: number;
          checkins: Record<string, 'green' | 'yellow' | 'red' | null>;
        }>();
      
        const datesSet = new Set<string>();
      
        for (const row of data) {
          const date = row.date.split('T')[0];
          datesSet.add(date);
      
          if (!grouped.has(row.key_result_id)) {
            grouped.set(row.key_result_id, {
              kr_text: row.kr_text,
              okr_type: row.okr_type,
              progress: row.progress,
              checkins: {}
            });
          }
      
          grouped.get(row.key_result_id)!.checkins[date] = row.confidence_flag;
        }
      
        const placarData = Array.from(grouped.values());
        const allDates = Array.from(datesSet).sort();
      
        console.log('[✅ VIEW] placarData FINAL:', placarData);
        console.log('[✅ VIEW] allDates FINAL:', allDates);
      
        set({
          placarData,
          allDates
        });

        console.log('[🚨 STORE SETADA] placarData.length:', placarData.length);
        console.log('[🚨 STORE SETADA] allDates.length:', allDates.length);
      }
      

  }));
