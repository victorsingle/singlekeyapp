import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';
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
    const { messages, userId, organizationId } = await req.json();

    if (!userId || !organizationId || !Array.isArray(messages)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const ultimoPrompt = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');

    const termosConfirmacao = [
      'pode gerar no sistema', 'pode gerar', 'pode criar no sistema',
      'sim, pode montar', 'gerar estrutura', 'criar estrutura'
    ];

    const termosDeOKR = [
      'okr', 'objetivo', 'key result', 'resultado-chave',
      'ciclo', 'estrutura', 'meta', 'estruturar', 'desdobrar'
    ];

    const promptVago = ['não sei', 'pensando', 'ainda não sei', 'em dúvida'].some(p => ultimoPrompt.includes(p));
    const confirmouGerar = termosConfirmacao.some(p => ultimoPrompt.includes(p));
    const querGerarOKRs = termosDeOKR.some(p => ultimoPrompt.includes(p)) && !promptVago;

    let promptSistema = '';

    if (confirmouGerar) {
      promptSistema = `
Você é uma IA chamada KAI. Gere agora apenas a estrutura JSON completa e pura dos OKRs com base na conversa anterior. O formato deve ser exatamente este:

{
  "ciclo": { ... },
  "okrs": [ ... ],
  "links": [ ... ]
}

Não inclua nenhuma explicação, introdução, emoji ou comentários.
      `.trim();
    } else if (querGerarOKRs) {
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

    const stream = await OpenAIStream(completion, {
      async onCompletion(completionText) {
        try {
          const jsonMatch = completionText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return JSON.stringify({
              content: completionText.replace(jsonMatch[0], '').trim(),
              okr_json: parsed,
            });
          } else {
            return JSON.stringify({ content: completionText });
          }
        } catch (err) {
          console.warn('[⚠️ JSON malformado na resposta]', err);
          return JSON.stringify({ content: completionText });
        }
      }
    });

    return new StreamingTextResponse(stream, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err) {
    console.error('[❌ Erro na função kai-chat]', err);
    return new Response('Erro interno da IA', { status: 500 });
  }
}
