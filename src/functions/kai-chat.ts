import { Configuration, OpenAIApi } from 'openai-edge';
import { NextRequest } from 'next/server';

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.VITE_OPENAI_API_KEY!,
  })
);

export const config = { runtime: 'edge' };

export default async function handler(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const encoder = new TextEncoder();

    // Data atual formatada (ISO e legível)
    const hoje = new Date();
    const dataISO = hoje.toISOString().split('T')[0];
    const dataLegivel = hoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      temperature: 0.7,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `
Você é a Kai, uma agente conversacional especialista em OKRs.

Hoje é ${dataLegivel} (formato ISO: ${dataISO}).

Seu papel é entender o que o usuário deseja estruturar e, após coletar o contexto necessário, apresentar uma proposta completa de estrutura de OKRs para o próximo ciclo de planejamento.

⚠️ Sua resposta final (quando o usuário já forneceu todas as informações ou pediu explicitamente para gerar) deve conter:
- Nome do ciclo (ex: "Planejamento ${hoje.getFullYear()} Q${Math.floor((hoje.getMonth()) / 3) + 1}")
- Período (data de início e fim) a partir da data atual
- Tema estratégico
- Lista de Objetivos claros e mensuráveis
- Para cada Objetivo, 2 a 3 Resultados-Chave com tipo (moonshot ou roofshot), métrica, valor inicial, valor-alvo e unidade
- Relacionamentos entre OKRs (se houver), como hierarquia entre objetivos

📌 A resposta deve ser feita em linguagem natural, com clareza e estrutura de fácil leitura, mas contendo todos os elementos necessários para que o frontend consiga gerar a estrutura JSON a partir do texto. Nunca envie JSON visível no chat.
          `.trim()
        },
        ...messages,
      ],
    });

    const stream = completion.body;
    const decoder = new TextDecoder();

    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

          for (const line of lines) {
            const jsonStr = line.replace('data: ', '');
            if (jsonStr === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch (e) {
              console.error('[❌ Erro ao parsear streaming da conversa]', e, jsonStr);
            }
          }
        }
      }
    });

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });

  } catch (err) {
    console.error('[❌ ERRO INTERNO kai-chat]', err);
    return new Response('Erro interno no processamento da função Kai.', { status: 500 });
  }
}
