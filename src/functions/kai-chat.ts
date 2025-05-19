import { Configuration, OpenAIApi } from 'openai-edge';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.VITE_OPENAI_API_KEY!
}));

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

    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    const isSaudacaoSimples = [
      'bom dia', 'boa tarde', 'boa noite', 'oi', 'olá', 'ola', 'e aí', 'fala', 'tudo bem', 'tudo bom'
    ].some(f => lastMessage.startsWith(f));

    const isMensagemExploratória = [
      'quero usar', 'me ajuda', 'ainda não sei', 'estou testando', 'preciso pensar',
      'organizar', 'como funciona', 'não tenho certeza', 'não comecei'
    ].some(f => lastMessage.includes(f));

    if (isSaudacaoSimples || isMensagemExploratória) {
      const reply = await openai.createChatCompletion({
        model: 'gpt-4o',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `Você é a Kai, uma IA cordial que ajuda pessoas a estruturarem OKRs.
Quando a intenção do usuário for apenas explorar, conversar ou dar uma saudação, responda de forma simpática e acolhedora. 
Nunca tente gerar uma estrutura completa de OKRs nesses casos. Incentive o usuário a te contar mais sobre o desafio do ciclo.`
          },
          ...messages,
        ],
        temperature: 0.6,
      });

      return new Response(reply.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Prompt principal para estrutura de OKRs (somente quando a intenção for clara)
    const dataAtual = new Date();
    const dataAtualFormatada = dataAtual.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');

    const systemPrompt = `
Você é do sexo feminino e se chama KAI, uma IA especializada na geração de OKRs estruturados com base em contexto organizacional.

⚠️ IMPORTANTE:
NUNCA retorne um JSON diretamente ao usuário.
Sua resposta deve sempre ser um texto natural, estruturado e legível, como se estivesse apresentando uma sugestão de planejamento.
A conversação é iterativa, e o conteúdo só será convertido em dados reais após aprovação do usuário.

---

🟦 ITEM ZERO: Sempre utilize a data atual como referência.
Hoje é: **${dataAtualFormatada}**

1. Proponha um ciclo com nome, data de início, data de fim e tema.
2. Proponha de 3 a 6 objetivos, sendo:
   - Pelo menos 1 estratégico
   - Pelo menos 1 tático
   - Pelo menos 1 operacional
3. Para cada objetivo, proponha 2 a 5 Resultados-Chave mensuráveis (evite tarefas).
4. Respeite a hierarquia:
   - Estratégico → Tático → Operacional (nunca salte níveis)

---

🎯 Formato da resposta (exemplo de estilo textual):

**Objetivo Estratégico**: Expandir presença internacional  
**Resultados-Chave**:  
• Abrir operação no Chile  
• Aumentar número de leads qualificados de 100 para 300  
• Contratar gerente local com experiência em B2B

Repita isso para todos os objetivos e indique de forma clara as relações hierárquicas.

Use português do Brasil sempre. Seja clara, objetiva e profissional.`.trim();

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
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
