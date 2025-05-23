import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AppUser {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'admin' | 'champion' | 'collaborator';
  status: 'pending' | 'active';
  invited_by?: string;
  team?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
  
    const { data: session } = await supabase.auth.getSession();
    const invitedBy = session?.session?.user?.id;
  
    // 1️⃣ Carrega usuários convidados
    const { data: usersData, error: usersError } = await supabase
      .from('invited_users')
      .select('*')
      .eq('invited_by', invitedBy)
      .order('created_at', { ascending: false });
  
    if (usersError) {
      console.error('[❌ useUsers] Erro ao carregar usuários:', usersError);
      setUsers([]);
      setLoading(false);
      return;
    }
  
    const userIds = usersData.map(u => u.id).filter(Boolean);
  
    // 2️⃣ Carrega membros de times (sem relacionamento nomeado)
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select('user_id, team_id')
      .in('user_id', userIds);
  
    if (memberError) {
      console.error('[❌ useUsers] Erro ao carregar team_members:', memberError);
    }
  
    const teamIds = [...new Set((memberData ?? []).map(m => m.team_id))];
  
    // 3️⃣ Carrega os nomes e líderes dos times
    const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, leader_id') // ✅ string única
    .in('id', teamIds);

   // console.log('[usersData]', usersData);
  //  console.log('[memberData]', memberData);
   // console.log('[teamsData]', teamsData);

    if (teamsError) {
    console.error('[❌ useUsers] Erro ao carregar teams:', teamsError);
    }

    // 4️⃣ Mapeia user_id → team.name
    const teamMap = new Map<string, string>();

    // membros
    (memberData ?? []).forEach(member => {
    const team = teamsData?.find(t => t.id === member.team_id);
    if (member.user_id && team?.name) {
      teamMap.set(member.user_id, team.name);
    }
    });

    // líderes
    (teamsData ?? []).forEach(team => {
    if (team.leader_id && team.name) {
      teamMap.set(team.leader_id, `${team.name} (Líder)`);
    }
    });
  
    // 5️⃣ Normaliza usuários
    const normalized = usersData.map(u => ({
      id: u.id,
      user_id: u.user_id,
      email: u.email,
      role: u.role,
      first_name: u.first_name,
      last_name: u.last_name,
      status: u.status,
      invited_by: u.invited_by,
      team: teamMap.get(u.id) ?? 'Sem time',
    }));
  
    setUsers(normalized);
    setLoading(false);
  };
  

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, refetch: fetchUsers, setUsers };
}
