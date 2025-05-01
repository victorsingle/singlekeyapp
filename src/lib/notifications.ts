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
  const cycleIdStr = String(cycleId);
  console.log('🚀 Iniciando criação de notificação');
  console.log('🔑 userId:', userId);
  console.log('🔁 cycleId:', cycleIdStr);

  // 🔍 Tenta buscar organização do user
  let organizationId: string | null = null;

  try {
    const { data: userOrg, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (userError) throw userError;
    if (userOrg?.organization_id) {
      organizationId = userOrg.organization_id;
      console.log('✅ organização via users:', organizationId);
    }
  } catch (err) {
    console.warn('⚠️ Falha ao buscar em `users`:', err.message);
  }

  // 🔁 Se não achou, tenta em invited_users
  if (!organizationId) {
    try {
      const { data: invitedOrg, error: invitedError } = await supabase
        .from('invited_users')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (invitedError) throw invitedError;
      if (invitedOrg?.organization_id) {
        organizationId = invitedOrg.organization_id;
        console.log('✅ organização via invited_users:', organizationId);
      }
    } catch (err) {
      console.warn('⚠️ Falha ao buscar em `invited_users`:', err.message);
    }
  }

  if (!organizationId) {
    console.error('❌ Não foi possível determinar a organização. Abortando.');
    return;
  }

  // 🔍 Busca champions da organização
  const { data: champions, error: championError } = await supabase
    .from('invited_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('role', 'champion');

  if (championError) {
    console.error('❌ Erro ao buscar champions:', championError.message);
    return;
  }

  const targetUserIds = [...(champions?.map(c => c.user_id) ?? []), userId];
  console.log('🎯 Usuários alvo:', targetUserIds);

  for (const targetId of targetUserIds) {
    console.log('🔄 Avaliando user:', targetId);

    try {
      const { data: existing, error: existError } = await supabase
        .from('user_notifications')
        .select('id')
        .eq('user_id', targetId)
        .eq('type', 'checkin_reminder')
        .eq('read', false)
        .eq('data->>cycle_id', cycleIdStr);

      if (existError) throw existError;

      const exists = existing?.length > 0;
      const alreadyDone = await checkIfActionDone();

      console.log(`[📎 ${targetId}] exists: ${exists}, alreadyDone: ${alreadyDone}`);

      if (exists || alreadyDone) {
        console.log(`⏭️ PULADO: notificação já existe ou check-in feito para ${targetId}`);
        continue;
      }

      const { error: insertError } = await supabase.from('user_notifications').insert({
        user_id: targetId,
        type: 'checkin_reminder',
        title,
        message: buildMessage(),
        data: { cycle_id: cycleIdStr },
        channel: ['app'],
      });

      if (insertError) {
        throw insertError;
      }

      console.log(`✅ Notificação criada para ${targetId}`);
    } catch (err) {
      console.error(`❌ Falha ao processar ${targetId}:`, err.message);
    }
  }

  console.log('🏁 Fim da função de criação de notificação');
}
  export async function clearOutdatedCheckinReminder(cycleId: string, userId: string) {
    const today = new Date().toLocaleDateString('sv-SE');
  
    const { data: checkins } = await supabase
      .from('okr_checkins')
      .select('id')
      .eq('cycle_id', cycleId)
      .eq('checkin_date', today)
      .limit(1);
  
    const stillValid = !!checkins?.length;
  
    if (stillValid) return;
  
    // 🧠 Buscar organização_id do user que está limpando
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();
  
    if (!userProfile?.organization_id) return;
  
    const { data: champions } = await supabase
      .from('invited_users')
      .select('user_id')
      .eq('organization_id', userProfile.organization_id)
      .eq('role', 'champion');
  
    const userIds = [...(champions?.map(c => c.user_id) ?? []), userId];
  
    // 🔁 Deletar para todos
    for (const uid of userIds) {
      await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', uid)
        .eq('type', 'checkin_reminder')
        .eq('data->>cycle_id', String(cycleId));
    }
  }
  
