import { supabase } from './supabase';


/**
 * Cria uma notificação apenas se:
 * - Não existir uma notificação do mesmo tipo e com a mesma `data[dataCheckKey]`
 * - A ação relacionada ainda não foi realizada (via função de verificação externa)
 */
export async function createNotificationIfNecessary({
    userId,
    cycleId,
    title,
    buildMessage,
    checkIfActionDone,
  }: {
    userId: string;
    cycleId: string;
    title: string;
    buildMessage: () => string;
    checkIfActionDone: () => Promise<boolean>;
  }) {
    console.log('[🔁 Verificando notificação]', { userId, cycleId });
  
    const cycleIdStr = String(cycleId);
  
    const { data: existing, error: existingError } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'checkin_reminder')
      .eq('read', false)
      .eq('data->>cycle_id', cycleIdStr); // ✅ filtro correto no JSONB
  
    if (existingError) {
      console.error('[❌ Erro ao buscar notificações existentes]', existingError);
      return;
    }
  
    const exists = existing && existing.length > 0;
    console.log('[📎 Já existe notificação com esse ciclo?]', exists);
  
    const alreadyDone = await checkIfActionDone();
    console.log('[📍 Check-in já foi feito?]', alreadyDone);
  
    if (exists || alreadyDone) {
      console.log('[⛔ Skip: notificação já criada ou check-in já feito]');
      return;
    }
  
    const { error: insertError } = await supabase.from('user_notifications').insert({
      user_id: userId,
      type: 'checkin_reminder',
      title,
      message: buildMessage(),
      data: { cycle_id: cycleIdStr }, // ✅ padronizado
      channel: ['app'],
    });
  
    if (insertError) {
      console.error('[❌ Erro ao criar notificação]', insertError);
    } else {
      console.log('[✅ Notificação criada com sucesso]');
    }
  }
  
  export async function clearOutdatedCheckinReminder(cycleId: string, userId: string) {
    const today = new Date().toLocaleDateString('sv-SE');
  
    // Verifica se o novo check-in ainda está marcado para hoje
    const { data } = await supabase
      .from('okr_checkins')
      .select('id')
      .eq('cycle_id', cycleId)
      .eq('checkin_date', today)
      .limit(1);
  
    const stillValid = !!data?.length;
  
    // Se a data não for mais hoje, apaga a notificação
    if (!stillValid) {
      await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'checkin_reminder')
        .eq('data->>cycle_id', cycleId); // acessa JSONB como texto
    }
  }
