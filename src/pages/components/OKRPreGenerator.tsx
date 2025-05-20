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

  const { userId, organizationId } = useAuthStore.getState();
  const generateFullOKRStructure = useOKRStore((state) => state.generateFullOKRStructure);
  const {
    phase,
    prompt,
    confirmedPrompt,
    setPrompt,
    setConfirmedPrompt,
    phaseTo
  } = useKaiChatStore();

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

async function simulateKaiTyping(content: string) {
  if (!content || typeof content !== 'string') {
    console.warn('[⚠️ simulateKaiTyping] Conteúdo inválido:', content);
    return;
  }

  console.log('[DEBUG] Simulando conteúdo:', content);
  let displayed = '';
  for (const char of content) {
    displayed += char;
    setCurrentResponse(displayed);
    await new Promise((r) => setTimeout(r, 10));
  }
}

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse, phase]);

  const isApprovalMessage = (text: string) => {
    const lower = text.toLowerCase();
    return [
      'pode cadastrar', 'vamos cadastrar', 'sim', 'top', 'perfeito',
      'gostei', 'legal', 'está ótimo', 'vamos em frente', 'fechou', 'pode ir'
    ].some(p => lower.includes(p));
  };

  const isGreeting = (text: string) => {
    return ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite']
      .some(p => text.toLowerCase().includes(p));
  };

  const handleSend = async () => {
    console.log('[DEBUG] handleSend iniciado | fase:', phase, '| input:', input);
    if (!input.trim()) return;

    const newMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    setCurrentResponse('');

    // Fase 1: aguardando contexto
    if (phase === 'awaiting_context') {
      
      if (isGreeting(input)) {
        const msg = 'Oi! Me conta um pouco sobre os desafios desse ciclo que deseja planejar.';
        await simulateKaiTyping(msg);
        setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
        setCurrentResponse('');
        setLoading(false);
        return;
      }

      setPrompt(input);
      phaseTo('awaiting_confirmation');
      const msg = 'Entendi! Posso gerar uma proposta de indicadores com base nisso?';
      await simulateKaiTyping(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
      setCurrentResponse('');
      setLoading(false);
      return;
    }

    // Fase 2: confirmação para gerar estrutura
if (phase === 'awaiting_confirmation' && isApprovalMessage(input)) {
  console.log('[DEBUG] Entrou em awaiting_confirmation');
  try {
    const res = await fetch('/.netlify/functions/kai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, newMessage],
        userId,
        organizationId,
        modo: 'gerar',
      }),
    });

    const content = await res.text();
    console.log('[DEBUG] Conteúdo final recebido da IA:', content);

    if (!content || content.length < 10) {
      throw new Error('[❌] Conteúdo inesperado ou vazio no front-end');
    }

    await simulateKaiTyping(content);
    setMessages((prev) => [...prev, { role: 'assistant', content }]);
    setCurrentResponse('');
    phaseTo('awaiting_adjustment');
    setConfirmedPrompt(content);
  } catch (err) {
    console.error('[❌ Erro na fase awaiting_confirmation]', err);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '❌ Algo deu errado ao gerar a proposta. Tente novamente ou recarregue a página.',
      },
    ]);
  } finally {
    setLoading(false);
  }

  return;
}


    // Fase 3: ajustes
    if (phase === 'awaiting_adjustment') {
      console.log('[DEBUG] Entrou em awaiting_adjustment');
      if (isApprovalMessage(input)) {
        phaseTo('ready_to_generate');
        setLoading(false);
        return;
      }

      const res = await fetch('/.netlify/functions/kai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          userId,
          organizationId,
          modo: 'gerar',
        }),
      });

      const raw = await res.text();
      let content = '';

      try {
        content = JSON.parse(raw);
      } catch {
        content = raw.replace(/^"|"$/g, '');
      }

      await simulateKaiTyping(content);
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
      setCurrentResponse('');
      setLoading(false);
      return;
    }

    // fallback: conversa inicial ou perguntas da IA
    const response = await fetch('/.netlify/functions/kai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, newMessage],
        userId,
        organizationId,
        modo: 'conversa',
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
          const content = parsed.content;
          if (content) {
            accumulated += content;
            setCurrentResponse(accumulated);
          }
        } catch (err) {
          console.error('[❌ Erro ao processar chunk da IA]', err);
        }
      }
    }

    if (accumulated) {
      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    }

    setCurrentResponse('');
    setLoading(false);
  };

  const handleGenerateOKRs = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const cicloId = await generateFullOKRStructure(confirmedPrompt);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '✅ OKRs cadastrados com sucesso! Redirecionando...' }
      ]);
      setTimeout(() => navigate(`/ciclos/${cicloId}`), 1500);
    } catch (err) {
      console.error('[❌ Erro ao cadastrar OKRs]', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro ao cadastrar OKRs. Tente novamente mais tarde.' }
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
          {phase === 'ready_to_generate' && (
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
            placeholder="Descreva aqui o desafio do ciclo..."
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
