import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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
    <div className="p-8 text-center">
      <p>Confirmando sua conta...</p>
    </div>
  );
}
