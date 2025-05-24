import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpCircle, Target, UserCircle2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useOKRStore } from '../../stores/okrStore';
import { useKaiChatStore } from '../../stores/useKaiChatStore';
import { parseStructuredTextToJSON } from '../../utils/parseOKRTextToJSON';
import { useOnboardingGuide } from '../../stores/useOnboardingGuide';
import { supabase } from '../../lib/supabase';



interface OKRPreGeneratorProps {
  fromOnboarding?: boolean;
}

export function OKRPreGenerator({ fromOnboarding }: OKRPreGeneratorProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const { teamsToCreate } = useKaiChatStore(); 

  useEffect(() => {
    const draft = localStorage.getItem('kai-chat-draft');
    if (draft) setInput(draft);
  }, []);

  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const resetKai = useKaiChatStore((s) => s.resetKai);


  const { generateFullOKRStructureFromJson } = useOKRStore();
  const {
    estruturaJson,
    setEstruturaJson,
    propostaConfirmada,
    setPropostaConfirmada
  } = useKaiChatStore();

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { startGuide } = useOnboardingGuide();

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Ei! Quer uma ajudinha com o planejamento? Me conta o que vem pela frente e eu te ajudo a construir os indicadores.'
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  useEffect(() => {
    localStorage.setItem('kai-chat-draft', input);
  }, [input]);

  // Limpa quando o componente é desmontado
  useEffect(() => {
    return () => {
      resetKai(); 
    };
  }, []);

  // Detecta aprovação e gera JSON localmente
useEffect(() => {
  if (messages.length < 2) return;

  const lastUserMessage = messages[messages.length - 1];
  const lastKaiMessage = messages.slice().reverse().find(m => m.role === 'assistant');


  if (
    lastUserMessage.role === 'user' &&
    /^(ok|pode gerar|está ótimo|confirmado|sim|tudo certo|agora sim|top|ficou top|massa|perfeito|muito bom|ficou muito bom)$/i.test(lastUserMessage.content.trim()) &&
    lastKaiMessage
  ) {
   // console.log('[🚀 Tentando gerar JSON a partir da última resposta da Kai]');
    try {
      const parsed = parseStructuredTextToJSON(lastKaiMessage.content);
      setEstruturaJson(parsed);
      setPropostaConfirmada(true);
   //   console.log('[✅ JSON gerado no frontend]', parsed);
    } catch (e) {
      console.error('[❌ Erro ao gerar JSON no frontend]', e);
    }
  }
}, [messages]);


  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    localStorage.removeItem('kai-chat-draft');
    setLoading(true);
    setCurrentResponse('');

    const res = await fetch('/.netlify/functions/kai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, newMessage],
        userId: useAuthStore.getState().userId,
        organizationId: useAuthStore.getState().organizationId,
        modo: 'conversa'
      }),
    });

    if (!res.ok || !res.body) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Ocorreu um erro ao processar. Tente novamente.' },
      ]);
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.startsWith('data:'));

      for (const line of lines) {
        const data = line.replace(/^data:\s*/, '');
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.content;

          if (content) {
            buffer += content;
            setCurrentResponse(buffer);
          }
        } catch (e) {
          console.error('Erro no parse do chunk:', e);
        }
      }
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: buffer }]);
    setCurrentResponse('');
    setLoading(false);

    // --- Registro leve e seguro de tokens estimados ---
    const promptTexto = messages.map(m => m.content).join(' ') + input;
    const respostaTexto = buffer;
    const totalTokensEstimado = Math.ceil((promptTexto.length + respostaTexto.length) / 4);

    const organizationId = useAuthStore.getState().organizationId;
    const hoje = new Date();
    const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;

    if (organizationId && totalTokensEstimado > 0) {
      try {
        const { data: existente, error: erroExistente } = await supabase
          .from('usage_tokens')
          .select('id, tokens_utilizados')
          .eq('account_id', organizationId)
          .eq('mes_referencia', mesReferencia)
          .maybeSingle();

        if (erroExistente) {
          console.warn('[❌ Erro ao buscar usage_tokens]', erroExistente);
        }

        if (existente) {
          await supabase
            .from('usage_tokens')
            .update({ tokens_utilizados: existente.tokens_utilizados + totalTokensEstimado })
            .eq('id', existente.id);
        } else {
          await supabase.rpc('criar_usage_tokens', {
            p_account_id: organizationId,
            p_mes: mesReferencia,
            p_tokens: totalTokensEstimado
          });
        }

       // console.log('[🔢 Tokens estimados registrados]', { totalTokensEstimado });
        window.dispatchEvent(new CustomEvent('kai:tokens:updated'));
      } catch (e) {
        console.error('[❌ Erro ao registrar tokens]', e);
      }
    }
  };

  const handleGenerateOKRs = async () => {
    try {
      setLoading(true);
      const cicloId = await generateFullOKRStructureFromJson(estruturaJson, fromOnboarding, teamsToCreate);


      if (fromOnboarding) {
        await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('user_id', useAuthStore.getState().userId);

        // ✅ Reflete na store imediatamente
        useAuthStore.setState({ onboardingCompleted: true });

        // ✅ Impede qualquer reexibição
        useOnboardingGuide.getState().skipGuide();
        //localStorage.setItem('has_seen_feature_guide', 'true');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '✅ OKRs cadastrados com sucesso! Redirecionando...' },
      ]);

      setTimeout(() => {
        navigate(`/cycle/${cicloId}?open=krs&guia=1`);
      }, 1500);

    } catch (err) {
      console.error('[❌ Erro ao cadastrar OKRs]', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '❌ Erro ao cadastrar. Verifique a estrutura e tente novamente.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-10">
      <div className="bg-white rounded-xl shadow-xl p-4 flex flex-col justify-between h-[500px] border border-gray-100">
        <div className="overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={clsx(
                'flex items-end gap-2',
                msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
              )}
            >
              <div className="flex-shrink-0">
                {msg.role === 'assistant' ? (
                  <Target className="w-5 h-5 text-blue-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                    {useAuthStore.getState().firstName?.charAt(0)?.toUpperCase() ??
                      useAuthStore.getState().userId?.charAt(0)?.toUpperCase() ??
                      'U'}
                  </div>
                )}
              </div>
              <div className={clsx(
                'text-sm p-3 rounded-xl whitespace-pre-wrap max-w-[80%]',
                msg.role === 'assistant'
                  ? 'bg-blue-50 text-gray-800'
                  : 'bg-gray-100 text-right ml-auto'
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {currentResponse && (
            <div className="bg-blue-50 text-gray-800 text-sm p-3 rounded-sm animate-pulse whitespace-pre-wrap">
              {currentResponse}
            </div>
          )}
          {estruturaJson && propostaConfirmada && (
            <button
            ref={buttonRef}
            onClick={async () => {
              if (buttonRef.current) {
                buttonRef.current.innerHTML = `
                  <svg class="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle>
                    <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Enviando...
                `;
                buttonRef.current.style.opacity = '0.6';
                buttonRef.current.style.pointerEvents = 'none';
              }
              await handleGenerateOKRs();
            }}
            className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 transition flex items-center gap-2 ml-[25px]"
          >
            Cadastrar Indicadores
          </button>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <Target className="absolute left-3 top-3 text-blue-500 w-4 h-4 animate-pulse" />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            disabled={loading}
            className="w-full text-sm pl-10 pr-10 py-3 rounded-xl border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Fale comigo..."
          />
         <button
            type="submit"
            disabled={loading || !input.trim()}
            className={clsx(
              'absolute right-3 bottom-3 transition',
              loading || !input.trim() ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'
            )}
          >
            <ArrowUpCircle className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
