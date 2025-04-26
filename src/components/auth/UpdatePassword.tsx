import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SuccessModal } from './SuccessModal';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PasswordStrengthSegments } from '../../components/PasswordStrengthSegments';


export function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const initializeSessionOrFetchInvite = async () => {
      const hash = window.location.hash;
      const query = new URLSearchParams(hash.substring(1));
      const access_token = query.get('access_token');
      const refresh_token = query.get('refresh_token');

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (error) {
            console.error('[❌ Erro ao aplicar sessão]', error);
            toast.error('Erro ao validar o link de redefinição.');
            navigate('/login');
          } else {
            setSessionReady(true);
          }
        });
      } else if (token) {
        const { data, error } = await supabase
          .from('invited_users')
          .select('email')
          .eq('token', token)
          .eq('status', 'pending')
          .single();

        if (error || !data) {
          console.error('[❌ Token inválido ou convite expirado]', error);
          toast.error('Convite inválido ou expirado.');
          navigate('/login');
          return;
        }

        setEmail(data.email);
        setSessionReady(true);
      } else {
        navigate('/login');
      }
    };

    initializeSessionOrFetchInvite();
  }, [navigate, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
  
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
  
    setLoading(true);
  
    try {
      if (email) {
        const response = await fetch('/.netlify/functions/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });
  
        let result = {};
        try {
          result = await response.json();
        } catch (error) {
          console.warn('[⚠️ Resposta não era JSON]', error);
        }
  
        if (!response.ok) {
          toast.error(result.message || 'Erro ao aceitar convite.');
          setLoading(false);
          return;
        }
  
        setShowSuccessModal(true);
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password });
  
        if (updateError) {
          console.error('[❌ Erro ao atualizar senha]', updateError);
          toast.error('Erro ao atualizar a senha. Tente novamente.');
          setLoading(false);
          return;
        }
  
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('[❌ Erro inesperado]', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Carregando sessão segura para redefinição...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xs space-y-8">
        <div className="flex justify-center">
          <Target className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-3 text-3xl font-extrabold text-gray-900">SingleKey</h2>
        <p className="mt-2 text-xs text-gray-600">Insira sua nova senha abaixo</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
          <label htmlFor="password" className="block text-xs font-medium text-gray-700">
            Nova Senha
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 p-2 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs border-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Aqui a barrinha */}
          <PasswordStrengthSegments password={password} />
        </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 p-2 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </form>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/login');
        }}
        title="Senha atualizada"
        message="Sua senha foi definida com sucesso. Você já pode fazer login."
      />
    </div>
  );
}
