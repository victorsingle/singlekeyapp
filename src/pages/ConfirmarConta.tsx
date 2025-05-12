import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RadarLoader from '../components/RadarLoader';

export function ConfirmarConta() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      console.error('[❌ Token ausente na URL]');
      return;
    }

    // ✅ Redireciona como se fosse clique direto no link da função
    window.location.replace(`/.netlify/functions/confirm-user?token=${token}`);
  }, []);

return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
    <RadarLoader />
    <p className="mt-4 text-gray-700 text-lg font-medium">
      Aguarde, estamos confirmando sua conta...
    </p>
  </div>
);
}
