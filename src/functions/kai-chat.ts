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

1. Com base no contexto, você irá sugerir uma estrutura de OKRs explicando em português natural, em tom profissional e acessível.
2. NÃO diga que vai gerar um "JSON". Diga que montou uma proposta e pergunte se o usuário deseja "gerar no sistema para acompanhamento".
3. NÃO inclua a estrutura dentro do chat. Apenas diga que está pronta e pode ser gerada ao lado.
4. Evite repetir emojis ou exagerar no uso deles.
5. Se o conteúdo estiver pronto, diga: "Está alinhado com o que você tinha em mente? Se quiser acompanhar no sistema, é só clicar no botão ao lado."

A estrutura será retornada apenas se o usuário confirmar explicitamente.
        `.trim();
      } else {
        promptSistema = `
Você é a Kai, uma IA especialista em OKRs. Responda de forma simpática e clara.

1. Se o usuário ainda estiver explorando ("ainda não sei", "pensando", "não sei por onde começar"), faça perguntas para entender melhor o desafio do ciclo.
2. Só sugira estrutura se o contexto estiver claro.
3. Evite repetir emojis ou parecer forçada. Naturalidade acima de tudo.
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
          while (true) {
            const { value, done } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

            for (const line of lines) {
              const content = line.replace(/^data:\s*/, '');
              if (content === '[DONE]') continue;

              controller.enqueue(encoder.encode(`${line}\n\n`));
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

    // ✅ MODO GERAR
    if (modo === 'gerar') {
      const promptSistema = `
Você é uma IA chamada KAI. Gere agora apenas a estrutura JSON completa e pura dos OKRs com base na conversa anterior. O formato deve ser exatamente este:

{
  "ciclo": {
    "nome": "...",
    "dataInicio": "...",
    "dataFim": "...",
    "temaEstratégico": "..."
  },
  "okrs": [
    {
      "objetivo": "...",
      "tipo": "moonshot | roofshot",
      "resultadosChave": [
        {
          "texto": "...",
          "métrica": "...",
          "valorInicial": 0,
          "valorAlvo": 100,
          "unidade": "%"
        }
      ]
    }
  ],
  "links": []
}

Não inclua explicação, comentários ou emojis. Responda apenas com o JSON.
      `.trim();

      const completion = await openai.createChatCompletion({
        model: 'gpt-4o',
        stream: false,
        messages: [
          { role: 'system', content: promptSistema },
          ...messages,
        ],
        temperature: 0.2,
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
