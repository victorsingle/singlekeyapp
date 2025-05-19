import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpCircle, Target } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useOKRStore } from '../../stores/okrStore';

export function OKRPreGenerator() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [parsedOKR, setParsedOKR] = useState<any | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const parsedRef = useRef<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const { userId, organizationId } = useAuthStore.getState();
  const generateFullOKRStructure = useOKRStore((state) => state.generateFullOKRStructure);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const lower = input.toLowerCase();
    const confirmationPhrases = [
      'pode gerar', 'vamos gerar', 'pode seguir', 'vamos seguir assim',
      'pode cadastrar', 'vamos cadastrar', 'sim', 'top', 'perfeito',
      'maneiro', 'massa', 'é isso', 'gostei', 'gostei bastante',
      'legal', 'está ótimo', 'está ótimo assim', 'vamos em frente',
      'tá bom', 'ok', 'fechou', 'tá certo', 'vamos nessa',
      'segue assim', 'tá ótimo', 'pode ir'
    ];

    const isConfirmation = confirmationPhrases.some(f => lower.includes(f));

    const newMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    setCurrentResponse('');

    if (isConfirmation && parsedRef.current) {
      setParsedOKR(parsedRef.current);
      setAwaitingConfirmation(true);
      setLoading(false);
      return;
    }

    const response = await fetch('/.netlify/functions/kai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, newMessage],
        userId,
        organizationId,
        modo: 'conversa'
      }),
    });

    if (!response.ok || !response.body) {
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'));

      for (const line of lines) {
        const jsonStr = line.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          let content = parsed.content;

          if (typeof content === 'string' && content.startsWith('[OKR_JSON]')) {
            const raw = content.replace('[OKR_JSON]', '');
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
              const json = JSON.parse(match[0]);
              if (json?.ciclo && Array.isArray(json.okrs)) {
                setParsedOKR(json);
                parsedRef.current = json;
                setAwaitingConfirmation(true);
              }
              content = raw.replace(match[0], '').trim();
            }
          }

          if (content) {
            accumulated += content;
            setCurrentResponse(accumulated);
          }
        } catch (err) {
          console.error('[❌ Erro ao processar chunk da IA]', err);
        }
      }

      scrollToBottom();
    }

    if (accumulated) {
      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    }

    setCurrentResponse('');
    setLoading(false);
  };

  const handleGenerateOKRs = async () => {
    if (!parsedOKR) return;
    setLoading(true);

    try {
      const result = await generateFullOKRStructure(parsedOKR);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '✅ OKRs cadastrados no sistema com sucesso! Redirecionando para o ciclo...',
        },
      ]);
      const cicloId = result?.ciclo?.id;
      if (cicloId) {
        setTimeout(() => navigate(`/ciclos/${cicloId}`), 1500);
      }
      setParsedOKR(null);
    } catch (err) {
      console.error('[❌ Erro ao cadastrar OKRs]', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ocorreu um erro ao tentar cadastrar os OKRs. Tente novamente mais tarde.',
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
          {awaitingConfirmation && (
            <div className="flex justify-end mt-2">
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
            placeholder="Descreva aqui o desafio do ciclo..."
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-3 text-blue-600 hover:text-blue-800"
          >
            <ArrowUpCircle className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
