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

Seu papel é ajudar o usuário a montar uma estrutura completa de OKRs, de forma clara e legível. O conteúdo gerado será aprovado pelo usuário e usado diretamente pelo sistema para cadastro.

⚠️ IMPORTANTE: a estrutura precisa ser COMPLETA para que a IA posterior possa converter diretamente para JSON, sem perda de informações.

Inclua os seguintes elementos:
- Nome do ciclo
- Data de início e fim do ciclo
- Tema estratégico
- De 3 a 6 objetivos (com o tipo: estratégico, tático ou operacional)
- Para cada objetivo, 2 a 5 resultados-chave (com tipo: moonshot | roofshot, métrica e unidade)
- Vínculos entre objetivos (seguindo a hierarquia Estratégico ➝ Tático ➝ Operacional)

📌 Use esse formato textual:
- **Ciclo:** Trimestre 2 de 2025 (01/04/2025 a 30/06/2025)
- **Tema:** Crescimento e consolidação da nova oferta
- **Objetivo 1 (Estratégico):** Expandir a presença da nova solução no mercado
  - KR1 (moonshot): Aumentar em 30% o número de leads qualificados — Métrica: Leads — Unidade: %
  - KR2 (roofshot): Obter 10 menções em mídias do setor — Métrica: Citações — Unidade: unidades
- **Objetivo 2 (Tático):** ...
  - KR1: ...
- **Objetivo 3 (Operacional):** ...
  - KR1: ...

🔗 No fim, inclua vínculos como:
- Vincular Objetivo 2 ao Objetivo 1
- Vincular Objetivo 3 ao Objetivo 2

Finalize com:
“Está tudo certo? Se quiser cadastrar no sistema, é só clicar no botão abaixo.”

⚠️ NUNCA use JSON, emojis ou estruturas de código. Apenas texto estruturado e limpo.
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

                const content =
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.choices?.[0]?.text ||
                  parsed.choices?.[0]?.message?.content;

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
Você é a Kai, uma IA especialista em planejamento com OKRs. Hoje é ${dataFormatada}.

Com base na conversa anterior, gere uma proposta de estrutura de OKRs clara, objetiva e em português natural, pronta para ser interpretada pela própria IA do sistema SingleKey.

A estrutura deve incluir:
- Nome e datas do ciclo
- Tema estratégico
- Objetivos (com seus tipos)
- Resultados-chave (com tipo e métrica)
- Vínculos entre objetivos

⚠️ Importante:
- NÃO envie em JSON
- NÃO use emojis
- Retorne apenas o texto estruturado (ex: "**Objetivo 1: ...**", "- KR 1: ...")
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
