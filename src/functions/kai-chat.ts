import { Configuration, OpenAIApi } from 'openai-edge';
import { createClient } from '@supabase/supabase-js';

// Configuração do OpenAI
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.VITE_OPENAI_API_KEY!,
}));

// Instância Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Detecta intenção de geração de OKRs
    const deveGerarEstrutura = [
      'okr',
      'objetivo',
      'key result',
      'resultado-chave',
      'ciclo',
      'estrutura',
      'meta',
      'estruturar'
    ].some(palavra => ultimoPrompt.includes(palavra));

    const promptSistema = deveGerarEstrutura
      ? `
Você é do sexo feminino e se chama KAI e é uma geradora de OKRs estruturados. Com base no contexto fornecido, você deve retornar uma sugestão **explicada em português natural**, antes da estrutura final.

A data de hoje é **${dataFormatada}**. Use-a como base para nomear períodos, ciclos e datas.

Após sua explicação, pergunte se o usuário quer gerar a estrutura completa. Somente gere a estrutura JSON se ele confirmar explicitamente.
      `
      : `
Você é a Kai, uma IA especialista em OKRs. Responda de forma simpática, curta e útil. Se o usuário ainda não forneceu contexto suficiente, incentive-o a descrever o desafio que deseja enfrentar neste ciclo.
`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: promptSistema },
        ...messages,
      ],
      temperature: 0.7,
    });

    return new Response(completion.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err) {
    console.error('[❌ Erro na função kai-chat]', err);
    return new Response('Erro interno da IA', { status: 500 });
  }
}
