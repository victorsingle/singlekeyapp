import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    const acceptInvite = async () => {
      if (!token) {
        toast.error('Token inválido.');
        navigate('/login');
        return;
      }

      // 1. Valida o token contra a tabela invited_users
      const { data: invitedUser, error: inviteError } = await supabase
        .from('invited_users')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitedUser) {
        toast.error('Convite inválido ou expirado.');
        navigate('/login');
        return;
      }

      const { email, first_name, role } = invitedUser;

      // 2. Cria o usuário no auth com senha temporária (será trocada em seguida)
      const tempPassword = crypto.randomUUID(); // ou nanoid()
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
      });

      if (signUpError || !signUpData.session) {
        toast.error('Erro ao criar usuário.');
        console.error('[❌ ERRO AO CRIAR USUÁRIO]', signUpError);
        navigate('/login');
        return;
      }

      // 3. Atualiza status do convite para "accepted"
      await supabase
        .from('invited_users')
        .update({ status: 'accepted' })
        .eq('id', invitedUser.id);

      // 4. Aplica sessão com os tokens retornados
      const { access_token, refresh_token } = signUpData.session;
      await supabase.auth.setSession({ access_token, refresh_token });

      // 5. Redireciona para update-password
      navigate('/update-password');
    };

    acceptInvite();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
      Validando convite e preparando seu acesso...
    </div>
  );
}
