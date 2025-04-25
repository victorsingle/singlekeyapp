import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error('Token inválido.');
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('invited_users')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast.error('Convite expirado ou inválido.');
        navigate('/login');
        return;
      }

      // Token válido → redireciona para definição de senha
      navigate(`/update-password?token=${token}`);
    };

    validateToken().finally(() => setLoading(false));
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
      {loading ? 'Validando convite...' : 'Redirecionando...'}
    </div>
  );
}
