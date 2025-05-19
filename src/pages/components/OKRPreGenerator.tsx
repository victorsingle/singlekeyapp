import { useState, useRef } from 'react';
import { ArrowUpCircle, Target } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useOKRStore } from '../../stores/okrStore';

interface ParsedOKR {
  ciclo: {
    nome: string;
    inicio: string;
    fim: string;
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
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const { userId, organizationId } = useAuthStore.getState();
  const generateFullOKRStructure = useOKRStore((state) => state.generateFullOKRStructure);

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

    // Tenta extrair o JSON oculto da resposta
    try {
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        if (jsonData?.ciclo && Array.isArray(jsonData.okrs)) {
          setParsedOKR(jsonData);
          setAwaitingConfirmation(true);

          // Remove o JSON da resposta visível
          const textOnly = accumulated.replace(jsonMatch[0], '').trim();

          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: textOnly },
            {
              role: 'assistant',
              content: 'Está alinhado com o que você tinha em mente? Se estiver tudo certo, clique no botão abaixo para cadastrar no sistema.',
            },
          ]);

          setCurrentResponse('');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[⚠️ Não foi possível interpretar JSON de OKRs]', err);
    }

    // Resposta normal se não for estrutura de OKRs
    setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    setCurrentResponse('');
    setLoading(false);
  };

  const handleGenerateOKRs = async () => {
    if (!parsedOKR) return;
    setLoading(true);

    try {
      await generateFullOKRStructure(parsedOKR);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '✅ OKRs cadastrados no sistema com sucesso! Agora você pode acompanhá-los normalmente.',
        },
      ]);
      setParsedOKR(null);
      setAwaitingConfirmation(false);
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
            <div className="flex justify-end">
              <button
                onClick={handleGenerateOKRs}
                className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Cadastrar OKRs no sistema
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
