import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const type = params.get('type');
      const next = params.get('next') || '/';

      console.log('[AuthCallback 🔐]', { code, type, next });

      if (code) {
        console.log('[➡️ Tentando exchangeCodeForSession()]', { code });
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('❌ Erro ao trocar código por sessão:', error);
        } else {
          console.log('✅ Sessão restaurada:', data.session);
          navigate(next);
        }
      } else {
        console.warn('⚠️ Nenhum código presente na URL');
        navigate('/login');
      }
    };

    run();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
      Confirmando acesso, aguarde...
    </div>
  );
}
