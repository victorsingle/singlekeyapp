import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserInvited?: () => void;
}

export function InviteUserModal({ isOpen, onClose, onUserInvited }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('collaborator');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async () => {
    if (!email || !firstName) {
      toast.error('Preencha o e-mail e o primeiro nome.');
      return;
    }

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData.session?.user?.id;

    if (!authUserId) {
      toast.error('Erro ao identificar o usuário logado.');
      setLoading(false);
      return;
    }

    const token = nanoid(32);

    const { error: insertError } = await supabase
      .from('invited_users')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        status: 'pending',
        invited_by: authUserId,
        token,
      }).single();

    if (insertError) {
      toast.error('Erro ao salvar usuário.');
      console.error('[❌ INSERT ERROR]', insertError);
      setLoading(false);
      return;
    }

    try {
      await fetch('/.netlify/functions/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          token,
        }),
      });

      toast.success('Convite enviado por e-mail!');
    } catch (emailError) {
      console.error('[❌ Email Invite Error]', emailError);
      toast.error('Usuário salvo, mas falha ao enviar e-mail.');
    }

    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('collaborator');
    setLoading(false);
    onClose();
    onUserInvited?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Convidar Usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
              placeholder="usuario@exemplo.com"
            />
          </div>

          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Primeiro Nome</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
            >
              <option value="admin">Administrador</option>
              <option value="champion">Champion</option>
              <option value="collaborator">Colaborador</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleInvite}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Convite'}
          </button>
        </div>
      </div>
    </div>
  );
}
