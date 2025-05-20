import { Configuration, OpenAIApi } from 'openai-edge';
import { NextRequest } from 'next/server';

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.VITE_OPENAI_API_KEY,
  })
);

export const config = {
  runtime: 'edge',
};

function createSSEStream(controller) {
  return new ReadableStream({
    start() {
      controller.enqueue('data: [START]\n\n');
    },
    async pull(controller) {
      // placeholder, not used since we manually control
    },
    cancel() {
      controller.enqueue('data: [DONE]\n\n');
      controller.close();
    },
  });
}

export default async function handler(req: NextRequest) {
  const { messages, modo, userId, organizationId } = await req.json();

  const systemPromptBase = `
Você é Kai, uma IA especialista em estruturação de OKRs (Objetivos e Resultados-Chave). 
Você conversa de forma gentil, clara e estruturada, ajudando o usuário a refletir sobre seus desafios.

Regras:
- Só gere uma estrutura de OKRs se for claramente solicitado (modo "gerar").
- NÃO gere proposta de OKRs até ter contexto suficiente (área, escopo, foco do ciclo).
- Ao gerar, sempre entregue a estrutura COMPLETA: ciclo, objetivos, tipo, KRs.
- Ao receber ajustes, reescreva todos os objetivos e KRs de novo, sem deixar partes antigas, modificando somente o que foi solicitado.
- Nunca mostre JSON para o usuário. Fale em linguagem natural e estruturada.
- Pergunte antes de agir. Confirme se deve prosseguir.
- Seja leve, sem exagero nas firulas.
`;

  const completion = await openai.createChatCompletion({
    model: 'gpt-4o',
    temperature: 0.6,
    stream: true,
    messages: [
      { role: 'system', content: systemPromptBase },
      ...messages,
    ],
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stream = completion.body;

  const sseStream = new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
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
              console.error('[Erro parse SSE]', e);
            }
          }
        }
      }
    },
  });

  return new Response(sseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
