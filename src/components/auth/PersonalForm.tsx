import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

export function PersonalForm() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Token de convite inválido ou ausente.');
      navigate('/login');
    }
  }, [token, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: invitedUser, error: fetchError } = await supabase
        .from('invited_users')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError || !invitedUser) {
        toast.error('Convite inválido ou expirado.');
        setIsLoading(false);
        return;
      }

      // Cria o usuário no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitedUser.email,
        password: formData.password,
      });

      if (signUpError || !authData?.user?.id) {
        toast.error('Erro ao criar sua conta. Tente novamente.');
        console.error('[❌ SignUp Error]', signUpError);
        setIsLoading(false);
        return;
      }

      const user_id = authData.user.id;

      // Insere o usuário finalizado na tabela 'users'
      const { error: insertUserError } = await supabase.from('users').insert({
        user_id,
        email: invitedUser.email,
        role: invitedUser.role,
        company_id: invitedUser.company_id,
        invited_by: invitedUser.invited_by,
      });

      if (insertUserError) {
        toast.error('Erro ao vincular seu perfil. Entre em contato com o suporte.');
        console.error('[❌ Insert User Error]', insertUserError);
        setIsLoading(false);
        return;
      }

      // Atualiza status do convite
      await supabase
        .from('invited_users')
        .update({ status: 'active' })
        .eq('id', invitedUser.id);

      toast.success('Cadastro realizado com sucesso! Redirecionando...');
      navigate('/ciclo');
    } catch (error) {
      console.error('[❌ Error]', error);
      toast.error('Erro ao finalizar o cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 space-y-6 bg-white">
      <h2 className="text-2xl font-semibold text-gray-800">Cadastro de Senha</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            name="password"
            className={`mt-1 block w-full rounded-md shadow-sm text-sm ${
              errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            name="confirmPassword"
            className={`mt-1 block w-full rounded-md shadow-sm text-sm ${
              errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar Senha'}
        </button>
      </form>
    </div>
  );
}
