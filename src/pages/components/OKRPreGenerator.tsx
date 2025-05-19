import { useState, useRef } from 'react';
import { ArrowUpCircle, Target } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';

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
    setParsedOKR(null);

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
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Aqui está uma proposta com base no seu desafio. Está alinhada com o que você imaginava? Se quiser seguir com ela, clique no botão ao lado para gerar no sistema.',
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl mx-auto px-6 py-10">
      {/* Chat com Kai */}
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

      {/* Painel de estrutura futura */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Estrutura de OKRs</h3>
        {!parsedOKR ? (
          <p className="text-sm text-gray-400 italic">
            Utilize o chat ao lado para planejar com a KAI.
          </p>
        ) : (
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <strong>Ciclo:</strong> {parsedOKR.ciclo.nome} ({parsedOKR.ciclo.dataInicio} → {parsedOKR.ciclo.dataFim})<br />
              <strong>Tema:</strong> {parsedOKR.ciclo.temaEstratégico}
            </div>
            {parsedOKR.okrs.map((okr, i) => (
              <div key={i} className="p-2 border rounded-md">
                <div><strong>{okr.tipo.toUpperCase()}</strong>: {okr.objetivo}</div>
                <ul className="list-disc list-inside mt-1">
                  {okr.resultadosChave.map((kr: any, k: number) => (
                    <li key={k}>{kr.texto} <span className="text-xs text-gray-500">({kr.tipo}, {kr.métrica})</span></li>
                  ))}
                </ul>
              </div>
            ))}
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => alert('Gerar no sistema!')}
            >
              Gerar no sistema
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
