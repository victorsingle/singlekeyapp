import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpCircle, Target } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useOKRStore } from '../../stores/okrStore';
import { useKaiChatStore } from '../../stores/useKaiChatStore';

export function OKRPreGenerator() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  const { generateFullOKRStructureFromJson } = useOKRStore();
  const {
    estruturaJson,
    setEstruturaJson
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
          console.log('[🔍 STREAMING RECEBIDO]', parsed);
          const content = parsed.content;
          const json = parsed.json;
          console.log('[🔍 STREAMING JSON]', json);
          if (content) {
            buffer += content;
            setCurrentResponse(buffer);

            // fallback para detectar JSON vindo dentro do content
            if (!json && content.includes('"ciclo"') && content.includes('"okrs"')) {
              try {
                const match = content.match(/{\s*"ciclo"[\s\S]+"links"\s*:\s*\[[\s\S]*?\]\s*}/);
                if (match && match[0]) {
                  const parsedJson = JSON.parse(match[0]);
                  console.log('[⚠️ JSON capturado manualmente do content]', parsedJson);
                  setEstruturaJson(parsedJson);
                }
              } catch (e) {
                console.warn('[⚠️ Falha ao tentar extrair JSON do content]', e);
              }
            }
          }

          if (json) {
            console.log('[✅ JSON estruturado recebido]', json);
            setEstruturaJson(json);
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
      console.log('[🚀 Enviando JSON para cadastro]', estruturaJson);
      const cicloId = await generateFullOKRStructureFromJson(estruturaJson);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '✅ OKRs cadastrados com sucesso! Redirecionando...' },
      ]);
      setTimeout(() => navigate(`/ciclos/${cicloId}`), 1500);
    } catch (err) {
      console.error('[❌ Erro ao cadastrar OKRs]', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Erro ao cadastrar. Verifique a estrutura e tente novamente.',
        },
      ]);
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
                'text-sm p-3 rounded-xl whitespace-pre-wrap',
                msg.role === 'assistant'
                  ? 'bg-blue-50 text-gray-800'
                  : 'bg-gray-100 text-right ml-auto'
              )}
            >
              {msg.content}
            </div>
          ))}
          {currentResponse && (
            <div className="bg-blue-50 text-gray-800 text-sm p-3 rounded-xl animate-pulse whitespace-pre-wrap">
              {currentResponse}
            </div>
          )}
          {estruturaJson && (
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
            disabled={loading}
            className="absolute right-3 top-3 text-blue-600 hover:text-blue-800"
          >
            <ArrowUpCircle className="w-7 h-7" />
          </button>
        </form>
      </div>
    </div>
  );
}
