import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function ConfirmarConta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'carregando' | 'erro' | 'ok'>('carregando');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('erro');
      return;
    }

    fetch(`/.netlify/functions/confirm-user?token=${token}`)
      .then(res => {
        if (res.status === 302) {
          // redirecionamento via função
          window.location.href = res.headers.get('Location')!;
        } else if (res.ok) {
          setStatus('ok');
          setTimeout(() => navigate('/login?confirmado=1'), 2000);
        } else {
          setStatus('erro');
        }
      })
      .catch(() => setStatus('erro'));
  }, []);

  return (
    <div className="p-8 text-center">
      {status === 'carregando' && <p>Confirmando sua conta...</p>}
      {status === 'ok' && <p>Conta confirmada com sucesso! Redirecionando...</p>}
      {status === 'erro' && <p>Não foi possível confirmar sua conta. Verifique o link.</p>}
    </div>
  );
}
