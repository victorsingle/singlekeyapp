import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../stores/notificationStore';
import toast from 'react-hot-toast';

interface CheckinButtonProps {
  cycleId: string;
  userId: string;
  checkinNotification?: {
    id: string;
  };
}

const mapConfidence = (value: string): 'green' | 'yellow' | 'red' => {
  switch (value) {
    case 'high':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'red';
    default:
      return 'yellow'; // fallback seguro
  }
};

export function CheckinButton({ cycleId, userId, checkinNotification }: CheckinButtonProps) {
  const { markAsRead, fetchNotifications } = useNotificationStore();
  const [isEligible, setIsEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString('sv-SE');
    const check = async () => {
      const { data, error } = await supabase
        .from('okr_checkins')
        .select('id')
        .eq('cycle_id', cycleId)
        .eq('checkin_date', today)
        .limit(1);

      if (error) {
        console.error('[❌ Erro ao verificar elegibilidade do check-in]', error);
        return;
      }

      setIsEligible(!!data?.length);
    };

    check();
  }, [cycleId]);

  const handleCheckin = async () => {
    setLoading(true);
    const today = new Date().toLocaleDateString('sv-SE');

    try {
      const { data: okrs, error: okrError } = await supabase
        .from('okrs')
        .select('id')
        .eq('cycle_id', cycleId);

      if (okrError || !okrs?.length) {
        toast.error('Erro ao buscar OKRs');
        console.error('[❌ Erro ao buscar OKRs]', okrError);
        return;
      }

      const okrIds = okrs.map((okr) => okr.id);

      const { data: keyResults, error: krError } = await supabase
        .from('key_results')
        .select('id, confidence_flag')
        .in('okr_id', okrIds);

      if (krError || !keyResults?.length) {
        toast.error('Erro ao buscar KRs');
        console.error('[❌ Erro ao buscar KRs]', krError);
        return;
      }

      const payload = keyResults.map((kr) => ({
        key_result_id: kr.id,
        user_id: userId,
        date: today,
        progress: 0,
        confidence_flag: mapConfidence(kr.confidence_flag),
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('key_result_checkins')
        .insert(payload);

      if (insertError) {
        toast.error('Erro ao registrar check-ins');
        console.error('[❌ Erro ao inserir check-ins]', insertError);
        return;
      }

      if (checkinNotification?.id) {
        await markAsRead(checkinNotification.id);
        await fetchNotifications(userId);
      }

      toast.success('Check-in realizado com sucesso!');
      setDone(true);
    } catch (err) {
      console.error('[❌ Erro inesperado no check-in]', err);
      toast.error('Erro inesperado ao fazer check-in');
    } finally {
      setLoading(false);
    }
  };

  const disabled = !isEligible || loading || done;

  return (
    <button
      onClick={handleCheckin}
      disabled={disabled}
      className={`flex items-center ml-2 px-4 py-2 rounded text-sm transition ${
        disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      <Calendar className="w-4 h-4 mr-2" />
      {loading ? 'Enviando...' : done ? 'Check-in Realizado' : 'Realizar Check-in'}
    </button>
  );
}
