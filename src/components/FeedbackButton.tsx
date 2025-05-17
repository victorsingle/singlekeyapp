import { useState } from "react";
import { toast } from "react-hot-toast";
import { MessageCircle } from 'lucide-react';
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { userId: authUserId } = useAuthStore();

const handleSend = async () => {
  if (!message.trim()) return;
  setLoading(true);

  if (!authUserId) {
    toast.error("Usuário não autenticado.");
    setLoading(false);
    return;
  }

  let organization_id: string | null = null;

  // Tenta buscar na tabela `users`
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("user_id", authUserId)
    .maybeSingle();

  if (userRow?.organization_id) {
    organization_id = userRow.organization_id;
  } else {
    // Se não achou, tenta buscar na tabela `invited_users`
    const { data: invitedRow } = await supabase
      .from("invited_users")
      .select("organization_id")
      .eq("user_id", authUserId)
      .maybeSingle();

    if (invitedRow?.organization_id) {
      organization_id = invitedRow.organization_id;
    }
  }

  if (!organization_id) {
    toast.error("Erro ao identificar usuário no sistema.");
    setLoading(false);
    return;
  }

  const { error: insertError } = await supabase.from("user_feedback").insert({
    user_id: authUserId,
    organization_id,
    message,
  });

  setLoading(false);

  if (insertError) {
    toast.error("Erro ao enviar feedback.");
  } else {
    toast.success("Feedback enviado com sucesso!");
    setMessage("");
    setOpen(false);
  }
};

  return (
    <div className="fixed bottom-6 right-4 z-50">
      {open ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 space-y-3">
          <textarea
            className="w-full h-24 p-2 border rounded resize-none text-sm"
            placeholder="Digite seu feedback e nos diga o que ainda precisamos melhorar ;)"
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="text-right text-xs text-gray-500">
            {message.length}/500
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={loading || message.trim().length === 0}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center py-2 px-4 bg-blue-600 text-white text-sm rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          title="Enviar feedback"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Feedback
        </button>
      )}
    </div>
  );
}



