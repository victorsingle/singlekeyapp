import { useState, useRef } from 'react';
import { ArrowUpCircle, Target } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { generateFullOKRStructure } from '../../stores/okrStore';

interface ParsedOKR {
  ciclo: {
    nome: string;
    dataInicio: string;
    dataFim: string;
    temaEstratégico: string;
  };
  okrs: any[];
  links: any[];
}

export function OKRPreGenerator() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [parsedOKR, setParsedOKR] = useState<ParsedOKR | null>(null);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    setCurrentResponse('');

    const { userId, organizationId } = useAuthStore.getState();

    const response = await fetch('/.netlify/functions/kai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, newMessage],
        userId,
        organizationId,
      }),
    });

    if (!response.ok || !response.body) {
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
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
          const content = parsed.choices?.[0]?.delta?.content;
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

    try {
      const tentativaJSON = accumulated.trim().match(/\{[\s\S]*\}/)?.[0];
      if (tentativaJSON) {
        const estrutura = JSON.parse(tentativaJSON);
        if (estrutura?.ciclo && Array.isArray(estrutura.okrs)) {
          setParsedOKR(estrutura);
          setUserConfirmed(false);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                'Está alinhado com o que você tinha em mente? Se quiser acompanhar no sistema, clique no botão abaixo.',
            },
          ]);
          setCurrentResponse('');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[⚠️ Não foi possível interpretar como estrutura JSON de OKRs]', err);
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    setCurrentResponse('');
    setLoading(false);
  };

  const handleGenerate = () => {
    if (parsedOKR) {
      generateFullOKRStructure(parsedOKR);
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
              {msg.role === 'user' && parsedOKR === null && input.toLowerCase().includes('sim') && (
                <span className="text-red-500"> (confirmação capturada)</span>
              )}
            </div>
          ))}

          {currentResponse && (
            <div className="bg-blue-50 text-gray-800 text-sm p-3 rounded-xl animate-pulse whitespace-pre-wrap">
              {currentResponse}
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

        {parsedOKR && (
          <div className="mt-4 text-center">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleGenerate}
            >
              Cadastrar OKRs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
