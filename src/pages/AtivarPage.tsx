import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

export function AtivarPage() {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const user_id = searchParams.get('user_id');
    if (!user_id) {
      setStatus('error');
      return;
    }

    const confirmUser = async () => {
      try {
        const response = await fetch(`/.netlify/functions/confirm-user?user_id=${user_id}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setStatus('success');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('[❌ Erro ao confirmar usuário]', err);
        setStatus('error');
      }
    };

    confirmUser();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      {status === 'pending' && (
        <p className="text-sm text-gray-500">Confirmando seu cadastro...</p>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="text-sm text-green-600">Cadastro ativado com sucesso!</p>
          <p className="text-xs text-gray-400">Redirecionando para login...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-2">
          <XCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm text-red-600">Erro ao confirmar o cadastro.</p>
          <p className="text-xs text-gray-400">Verifique se o link está correto ou já foi utilizado.</p>
        </div>
      )}
    </div>
  );
}
