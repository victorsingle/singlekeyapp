import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { validateEmail } from '../../utils/validation';
import { SuccessModal } from './SuccessModal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !validateEmail(email)) {
      setError('Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) {
        console.error('[❌ Erro ao enviar link de recuperação]', resetError);
        toast.error('Erro ao enviar link de recuperação. Tente novamente.');
        setLoading(false);
        return;
      }

      toast.success('Link de recuperação enviado com sucesso!');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('[❌ Erro inesperado no reset]', err);
      toast.error('Erro inesperado. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xs space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Target className="h-12 w-12 text-blue-600 mx-auto" />
          </div>
          <h2 className="mt-0 text-2xl font-extrabold text-gray-900">SingleKey</h2>
          <p className="mt-0 text-xs text-gray-600">Informe seu e-mail para recuperar sua senha.</p>
        </div>

        {/* Formulário */}
        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>

          <div className="mt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Lembrou sua senha?</span>
              </div>
            </div>

            <div className="mt-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Voltar para o login
              </button>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="Verifique seu e-mail"
        message="Enviamos um link de recuperação para o e-mail informado. Acesse o link para redefinir sua senha."
      />
    </div>
  );
}
