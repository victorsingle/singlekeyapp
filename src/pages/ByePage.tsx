import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ByePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/'); // Redireciona para home após 6s (opcional)
    }, 6000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg space-y-4">
        <h1 className="text-3xl font-bold text-blue-700">Sua conta foi encerrada</h1>
        <p className="text-xs text-gray-500">
          Todos os dados da organização foram removidos com sucesso. Obrigado por usar o SingleKey. Esperamos te ver novamente em breve! 💙
        </p>
        <button
          onClick={() => navigate('/site')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Voltar para o início
        </button>
      </div>
    </div>
  );
}
