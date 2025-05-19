import { Configuration, OpenAIApi } from 'openai-edge';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.VITE_OPENAI_API_KEY!,
}));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages, userId, organizationId, modo = 'conversa' } = await req.json();

    if (!userId || !organizationId || !Array.isArray(messages)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');

    const ultimoPrompt = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const promptVago = ['não sei', 'pensando', 'ainda não sei', 'em dúvida'].some(p => ultimoPrompt.includes(p));

    let promptSistema = '';

    // 🔁 MODO CONVERSA
    if (modo === 'conversa') {
      const termosDeOKR = [
        'okr', 'objetivo', 'key result', 'resultado-chave',
        'ciclo', 'estrutura', 'meta', 'estruturar', 'desdobrar'
      ];
      const querGerarOKRs = termosDeOKR.some(p => ultimoPrompt.includes(p)) && !promptVago;

      if (querGerarOKRs) {
        promptSistema = `
Você é a Kai, uma IA especialista em planejamento com OKRs. Hoje é ${dataFormatada}.

Seu papel é ajudar o usuário a montar uma estrutura completa de OKRs para o ciclo atual.

✅ Você deve gerar:
- Nome do ciclo
- Data de início e fim (3 meses a partir de hoje)
- Tema estratégico
- De 3 a 6 objetivos com tipo: estratégico, tático ou operacional
- De 2 a 5 KRs por objetivo, com tipo (moonshot | roofshot), métrica e unidade
- Vínculos entre objetivos (ex: Vincular Objetivo 3 ao Objetivo 2)

🧠 Se o usuário solicitar ajustes, atualize apenas a parte solicitada, mantendo o restante como está. Nunca sobrescreva tudo a cada mensagem.

⚠️ Nunca use JSON ou emojis. Responda com texto limpo e estruturado, como neste exemplo:
**Ciclo:** Trimestre 2 de 2025 (01/04/2025 a 30/06/2025)
**Tema:** Crescimento e consolidação da nova oferta
**Objetivo 1 (Estratégico):** ...
- KR1 (moonshot): ... — Métrica: ... — Unidade: ...
- KR2 (roofshot): ... — Métrica: ... — Unidade: ...

Finalize perguntando se o conteúdo está bom ou se o usuário deseja ajustar algo antes de cadastrar.
        `.trim();
      } else {
        promptSistema = `
Você é a Kai, uma IA especialista em OKRs. Responda de forma simpática e clara.

Se o usuário estiver indeciso, faça perguntas para entender melhor o contexto e só proponha estrutura quando houver clareza suficiente.

Nunca use JSON ou emojis. Seja natural, humana e objetiva.
        `.trim();
      }

      const completion = await openai.createChatCompletion({
        model: 'gpt-4o',
        stream: true,
        messages: [
          { role: 'system', content: promptSistema },
          ...messages,
        ],
        temperature: 0.7,
      });

      const encoder = new TextEncoder();
      const reader = completion.body?.getReader();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          let buffer = '';
          while (true) {
            const { value, done } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

            for (const line of lines) {
              const jsonStr = line.replace(/^data:\s*/, '');
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  buffer += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (err) {
                console.warn('[⚠️ Erro ao parsear linha de streaming]', err);
              }
            }
          }

          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // ✅ MODO GERAR — estrutura final como texto
    if (modo === 'gerar') {
      const promptSistema = `
Você é a Kai, uma IA especialista em OKRs. Hoje é ${dataFormatada}.

Sua tarefa agora é gerar a estrutura completa e final de OKRs APROVADA pelo usuário em formato textual.

Inclua:
- Nome do ciclo e datas (3 meses)
- Tema estratégico
- Objetivos (com tipo)
- KRs com tipo, métrica e unidade
- Vínculos entre objetivos

⚠️ Não use JSON. Retorne texto puro, bem estruturado, fiel ao que foi validado. Não adicione nada além do que o usuário viu e aprovou.
      `.trim();

      const completion = await openai.createChatCompletion({
        model: 'gpt-4o',
        stream: false,
        messages: [
          { role: 'system', content: promptSistema },
          ...messages,
        ],
        temperature: 0.3,
      });

      const jsonRaw = await completion.json();
      const content = jsonRaw.choices?.[0]?.message?.content || '';

      return new Response(content, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Modo inválido', { status: 400 });
  } catch (err) {
    console.error('[❌ Erro na função kai-chat]', err);
    return new Response('Erro interno da IA', { status: 500 });
  }
}
