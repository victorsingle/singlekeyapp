import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';


export function useOrgCheckinStatus(cycleId?: string) {
  const [orgHasCheckedInToday, setOrgHasCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasValidCheckinReminderToday, setHasValidCheckinReminderToday] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const organizationId = useAuthStore(state => state.organizationId);
  console.log('[HOOK] OrgCheckinStatus: organizationId:', organizationId, 'cycleId:', cycleId);

  useEffect(() => {
    if (!cycleId || !organizationId) return;

    const checkStatus = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. Buscar todas as datas programadas no passado ou hoje
        const { data: scheduledDates, error: datesError } = await supabase
          .from('okr_checkins')
          .select('checkin_date')
          .eq('cycle_id', cycleId);

        if (datesError || !scheduledDates?.length) {
          setOrgHasCheckedInToday(false);
          setHasValidCheckinReminderToday(false);
          setReminderMessage(null);
          setLoading(false);
          return;
        }

        const validDates = scheduledDates
        .map((item) => item.checkin_date)
        .filter((d) => {
            const checkinDate = new Date(d);
            return checkinDate <= today;
        })
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const lastDueDate = validDates[validDates.length - 1];

        if (!lastDueDate) {
          setOrgHasCheckedInToday(false);
          setHasValidCheckinReminderToday(false);
          setReminderMessage(null);
          setLoading(false);
          return;
        }

        // 2. Verifica se já houve check-in nessa data
        const { data: checkins, error: checkinError } = await supabase
          .from('key_result_checkins')
          .select('id')
          .eq('cycle_id', cycleId)
          .eq('date', lastDueDate)
          .limit(1);

        const checkedIn = checkins?.length > 0;

        setOrgHasCheckedInToday(checkedIn);
        
        const isTodayScheduled = lastDueDate === todayStr;

        setHasValidCheckinReminderToday(isTodayScheduled && !checkedIn);
        setReminderMessage(isTodayScheduled && !checkedIn ? 'Você tem um check-in pendente para hoje' : null);

      } catch (err) {
        console.error('[❌ Erro inesperado ao verificar status da organização]', err);
        setOrgHasCheckedInToday(false);
        setHasValidCheckinReminderToday(false);
        setReminderMessage(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [cycleId, organizationId]);

  return {
    orgHasCheckedInToday,
    hasValidCheckinReminderToday,
    reminderMessage,
    loading,
  };
}
