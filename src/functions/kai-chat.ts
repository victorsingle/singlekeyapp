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
    const saudacoes = ['boa noite', 'bom dia', 'boa tarde'];

    let promptSistema = '';

    // 🔁 MODO CONVERSA
    if (modo === 'conversa') {
      const contextoInicial = messages.length <= 2 && !saudacoes.includes(ultimoPrompt);

      if (contextoInicial || (!promptVago && ultimoPrompt.length > 60)) {
        // O contexto inicial é considerado suficiente se o prompt tiver mais de 60 caracteres e não for vago
        promptSistema = `
Você é a Kai, uma IA especialista em planejamento com OKRs. Hoje é ${dataFormatada}.

Com base no contexto fornecido pelo usuário, proponha uma estrutura de OKRs completa e validável, explicando em português natural e tom profissional.

✅ A estrutura textual deve conter:
- Nome e datas do ciclo
- Tema estratégico
- 3 a 6 Objetivos (com tipo: estratégico, tático, operacional)
- 2 a 4 KRs por objetivo (com tipo: moonshot | roofshot, métrica e unidade)
- Vínculos entre objetivos no final (ex: "Vincular Objetivo 2 ao Objetivo 1")

🔗 Exemplo de formato:
**Ciclo:** Trimestre 3 de 2025 (01/07/2025 a 30/09/2025)  
**Tema:** Consolidação e crescimento da nova solução  
**Objetivo 1 (Estratégico):** Expandir o reconhecimento da marca  
- KR1 (moonshot): Aumentar em 30% o número de menções orgânicas — Métrica: Citações — Unidade: unidades  
- KR2 (roofshot): ...  
**Objetivo 2 (Tático):** ...  
**Objetivo 3 (Operacional):** ...  
Vincular Objetivo 2 ao Objetivo 1  
Vincular Objetivo 3 ao Objetivo 2  

No fim, diga:  
"Está tudo certo? Se quiser cadastrar no sistema, é só clicar no botão abaixo."

🚫 Não use emojis nem JSON.  
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
- Resultados-chave (com tipo, métrica, unidade)
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
