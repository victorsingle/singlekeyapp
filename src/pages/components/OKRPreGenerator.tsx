import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpCircle, Target, UserCircle2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useOKRStore } from '../../stores/okrStore';
import { useKaiChatStore } from '../../stores/useKaiChatStore';
import { parseStructuredTextToJSON } from '../../utils/parseOKRTextToJSON';

export function OKRPreGenerator() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  const { generateFullOKRStructureFromJson } = useOKRStore();
  const {
    estruturaJson,
    setEstruturaJson,
    propostaConfirmada,
    setPropostaConfirmada
  } = useKaiChatStore();

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou a Kai, sua assistente para estruturar OKRs. Como posso te ajudar hoje?'
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  // Detecta aprovação e gera JSON localmente
useEffect(() => {
  if (messages.length < 2) return;

  const lastUserMessage = messages[messages.length - 1];
  const lastKaiMessage = messages.slice().reverse().find(m => m.role === 'assistant');

  console.log('[🧠 Verificando confirmação]', {
    lastUserMessage: lastUserMessage.content,
    lastKaiMessage: lastKaiMessage?.content?.slice(0, 100) + '...',
  });

  if (
    lastUserMessage.role === 'user' &&
    /^(ok|pode gerar|está ótimo|confirmado|sim|tudo certo)$/i.test(lastUserMessage.content.trim()) &&
    lastKaiMessage
  ) {
    console.log('[🚀 Tentando gerar JSON a partir da última resposta da Kai]');
    try {
      const parsed = parseStructuredTextToJSON(lastKaiMessage.content);
      setEstruturaJson(parsed);
      setPropostaConfirmada(true);
      console.log('[✅ JSON gerado no frontend]', parsed);
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
  };

  const handleGenerateOKRs = async () => {
    try {
      setLoading(true);
      const cicloId = await generateFullOKRStructureFromJson(estruturaJson);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '✅ OKRs cadastrados com sucesso! Redirecionando...' },
      ]);
      setTimeout(() => navigate(`/ciclos/${cicloId}`), 1500);
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
      <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between h-[500px] border border-gray-100">
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
                  <UserCircle2 className="w-5 h-5 text-gray-400" />
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
            <div className="flex justify-start mt-2">
              <button
                onClick={handleGenerateOKRs}
                className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Cadastrar Indicadores
              </button>
            </div>
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
