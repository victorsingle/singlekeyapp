import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useTeams() {
  const organizationId = useAuthStore((s) => s.organizationId);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = async () => {
    if (!organizationId) {
      console.warn('[⚠️ fetchTeams] organizationId ausente');
      return [];
    }
  
    setLoading(true);
  
    const [teamRes, membersRes, usersRes] = await Promise.all([
      supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          organization_id,
          leader_id,
          invited_users:leader_id (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', organizationId),
  
      supabase.from('team_members').select('team_id, user_id'),
  
      supabase.from('invited_users').select('id, first_name, last_name'),
    ]);
  
    setLoading(false);
  
    if (teamRes.error || membersRes.error || usersRes.error) {
      throw teamRes.error || membersRes.error || usersRes.error;
    }
  
    const usersMap = Object.fromEntries(
      (usersRes.data ?? []).map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()])
    );
  
    const teamMembersMap = (membersRes.data ?? []).reduce((acc, m) => {
      if (!acc[m.team_id]) acc[m.team_id] = [];
      acc[m.team_id].push({
        id: m.user_id,
        name: usersMap[m.user_id] || 'Desconhecido',
      });
      return acc;
    }, {} as Record<string, { id: string; name: string }[]>);
  
    const formatted = (teamRes.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      leaderId: t.leader_id,
      leaderName: t.invited_users
        ? `${t.invited_users.first_name} ${t.invited_users.last_name}`.trim()
        : '—',
      members: teamMembersMap[t.id] || [],
    }));
    
    
    setTeams(formatted);
    return formatted;
  };

  const createTeam = async (data: { name: string; description: string; leader: string }) => {
    const { organizationId, userId } = useAuthStore.getState();
  
    if (!organizationId || !userId) {
      console.error('[❌ createTeam] Dados ausentes', { organizationId, userId });
      return;
    }
  
    const { name, description, leader } = data;
   // console.log('[INSERT] Enviando organização:', organizationId, 'usuário:', userId);
    const { error } = await supabase.from('teams').insert({
      name,
      description,
      leader_id: leader,
      organization_id: organizationId,
      created_by: userId,
    });
  
    if (error) throw error;
  };

  const updateTeam = async (teamId: string, data: { name: string; description: string; leader: string }) => {
    const { error } = await supabase
      .from('teams')
      .update({
        name: data.name,
        description: data.description,
        leader_id: data.leader,
      })
      .eq('id', teamId);
  
    if (error) throw error;
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;
  };

  const addMembersToTeam = async (teamId: string, userIds: string[], role = 'member') => {
    for (const userId of userIds) {
      // Garante que o user_id existe na tabela `users`
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
  
      if (selectError) throw selectError;
  
      if (!existingUser) {
        const { error: insertStubError } = await supabase
          .from('users')
          .insert({ id: userId });
  
        if (insertStubError) throw insertStubError;
      }
  
      // Tenta adicionar à team_members
      const { error: insertMemberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
        });
  
      if (insertMemberError) {
        // Se já for membro, ignora
        if (insertMemberError.code !== '23505') {
          throw insertMemberError;
        }
      }
    }
  };  

  return {
    teams,
    setTeams,
    fetchTeams,
    refetch: fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addMembersToTeam,
    loading,
  };
}
