import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AppUser {
  id: string; // <-- usar sempre 'id', nunca 'user_id'
  user_id?: string; // se quiser ainda manter
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'admin' | 'champion' | 'collaborator';
  status: 'pending' | 'active'; // Adicionando status que pode ser útil
  invited_by?: string; // Adicionando o campo para saber quem convidou
}

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const { data, error } = await supabase
      .from('invited_users')
      .select('id, email, first_name, last_name, role, status, invited_by, user_id')  // Incluindo o campo invited_by
      .eq('invited_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[❌ useUsers] Erro ao carregar usuários:', error);
      setUsers([]);
    } else {
      // Normalizando os dados de convidados
      const normalized = (data ?? []).map((u) => ({
        id: u.id,               // Sempre garantido
        user_id: u.user_id,     // Pode ser undefined/null
        email: u.email,
        role: u.role,
        first_name: u.first_name,
        last_name: u.last_name,
        status: u.status,       // Status de convidado
        invited_by: u.invited_by, // Quem convidou
      }));

      setUsers(normalized);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, refetch: fetchUsers, setUsers };
}
