import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../stores/notificationStore';
import toast from 'react-hot-toast';

interface CheckinButtonProps {
  cycleId?: string;
  userId?: string; // sempre o ID do Supabase Auth, vindo de users ou invited_users
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
      return 'yellow';
  }
};

export function CheckinButton({ cycleId, userId, checkinNotification }: CheckinButtonProps) {
  const { markAsRead, fetchNotifications } = useNotificationStore();
  const [isEligible, setIsEligible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cycleId) {
      console.warn('[⚠️ Check-in] cycleId ausente', { cycleId });
      return;
    }
  
    const today = new Date().toISOString().slice(0, 10);
    console.log('[🔁 Verificando elegibilidade global de check-in]', { cycleId, today });
  
    const check = async () => {
      try {
        // Verifica se já houve algum check-in hoje para esse ciclo
        const { data: checkins, error } = await supabase
          .from('key_result_checkins')
          .select('id')
          .eq('cycle_id', cycleId) // você precisa adicionar esse campo em `key_result_checkins`, se não existir
          .eq('date', today)
          .limit(1);
  
        if (error) {
          console.error('[❌ Erro ao verificar check-ins da organização]', error);
          return;
        }
  
        const jaTemCheckinHoje = (checkins?.length ?? 0) > 0;
        setIsEligible(!jaTemCheckinHoje);
      } catch (err) {
        console.error('[❌ Erro inesperado na verificação global]', err);
      }
    };
  
    check();
  }, [cycleId]);
  

  const handleCheckin = async () => {
    if (!userId || !cycleId) return;

    setLoading(true);
    const today = new Date().toLocaleDateString('sv-SE');

    try {
      // Busca os OKRs do ciclo
      const { data: okrs, error: okrError } = await supabase
        .from('okrs')
        .select('id')
        .eq('cycle_id', cycleId);

      if (okrError || !okrs?.length) {
        toast.error('Erro ao buscar OKRs');
        return;
      }

      const okrIds = okrs.map((okr) => okr.id);

      // Busca os KRs vinculados
      const { data: keyResults, error: krError } = await supabase
        .from('key_results')
        .select('id, confidence_flag')
        .in('okr_id', okrIds);

      if (krError || !keyResults?.length) {
        toast.error('Erro ao buscar KRs');
        return;
      }

      // Monta o payload dos check-ins
      const payload = keyResults.map((kr) => ({
        key_result_id: kr.id,
        user_id: userId,
        date: today,
        progress: 0,
        confidence_flag: mapConfidence(kr.confidence_flag),
        created_at: new Date().toISOString(),
        cycle_id: cycleId,
      }));

      const { error: insertError } = await supabase
        .from('key_result_checkins')
        .insert(payload);

      if (insertError) {
        console.error('[❌ Erro ao inserir check-ins]', insertError);
        toast.error('Erro ao registrar check-ins');
        return;
      }

      // Marca notificação como lida (se existir)
      if (checkinNotification?.id) {
        await markAsRead(checkinNotification.id);
        await fetchNotifications(userId);
      }

      toast.success('Check-in realizado com sucesso!');
      setIsEligible(false);
    } catch (err) {
      console.error('[❌ Erro inesperado no check-in]', err);
      toast.error('Erro inesperado ao fazer check-in');
    } finally {
      setLoading(false);
    }
  };

  const disabled = !isEligible || loading;
  const alreadyCheckedIn = !isEligible && !loading;
  
  console.log('[💡 Props recebidas no botão]', { userId, cycleId });

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
      {loading ? 'Enviando...' : alreadyCheckedIn ? 'Check-in Realizado' : 'Realizar Check-in'}
    </button>
  );
}
