'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function ConfirmDeleteSection({ orgName }: { orgName: string }) {
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleDelete() {
    if (confirmation !== orgName) return;

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.access_token) {
        toast.error('Sessão inválida.');
        return;
      }

      const res = await fetch('https://ddopwcbobngaynhkoxhk.supabase.co/functions/v1/delete_account_final', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        toast.error('Erro ao excluir a organização');
        return;
      }

      toast.success('Conta encerrada com sucesso');
      await supabase.auth.signOut();
      navigate('/bye');

    } catch {
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 text-xs text-gray-600 bg-red-50 border p-4 border-red-100 rounded-lg">
      <h2 className="text-sm font-semibold text-red-700">Excluir Conta</h2>
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <span>
          Digite <strong>{orgName}</strong> para confirmar:
        </span>
        <input
          type="text"
          className="border border-gray-300 rounded px-2 py-2 text-xs w-full md:w-48"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <button
          onClick={handleDelete}
          disabled={confirmation !== orgName || loading}
          className={`text-xs h-8 px-3 rounded transition ${
            confirmation === orgName && !loading
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </div>
  );
}
