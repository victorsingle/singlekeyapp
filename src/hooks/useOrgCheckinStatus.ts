import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useOrgCheckinStatus(cycleId?: string, version: number = 0) {
  const [orgHasCheckedInToday, setOrgHasCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasValidCheckinReminderToday, setHasValidCheckinReminderToday] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  const organizationId = useAuthStore(state => state.organizationId);

  useEffect(() => {
    const checkStatus = async () => {
      console.log('[🔁 checkStatus called]', { cycleId, version });

      if (!cycleId || !organizationId) return;

      setLoading(true);
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const { data: scheduledDates } = await supabase
          .from('okr_checkins')
          .select('checkin_date')
          .eq('cycle_id', cycleId);

        const validDates = scheduledDates
          ?.map(item => item.checkin_date)
          .filter(d => new Date(d) <= today)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const lastDueDate = validDates?.at(-1);
        if (!lastDueDate) {
          setOrgHasCheckedInToday(false);
          setHasValidCheckinReminderToday(false);
          setReminderMessage(null);
          return;
        }

        const { data: checkins } = await supabase
          .from('key_result_checkins')
          .select('id')
          .eq('cycle_id', cycleId)
          .eq('date', lastDueDate)
          .limit(1);

        const checkedIn = checkins?.length > 0;
        const isToday = lastDueDate === todayStr;

        setOrgHasCheckedInToday(checkedIn);
        setHasValidCheckinReminderToday(!checkedIn);
        setReminderMessage(
          !checkedIn
            ? isToday
              ? 'Dia de Check-in! Atualize suas métricas e registre o nível de confiança clicando em "Realizar Check-in".'
              : 'Você tem um check-in atrasado! Atualize suas métricas e registre o nível de confiança clicando em "Realizar Check-in".'
            : null
        );
      } catch (err) {
        console.error('[❌ Erro ao verificar status de check-in]', err);
        setOrgHasCheckedInToday(false);
        setHasValidCheckinReminderToday(false);
        setReminderMessage(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [cycleId, organizationId, version]);

  return {
    orgHasCheckedInToday,
    hasValidCheckinReminderToday,
    reminderMessage,
    loading,
  };
}
