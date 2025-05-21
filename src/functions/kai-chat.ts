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

export default async function handler(req: NextRequest) {
  try {
    const { messages, modo } = await req.json();

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    if (modo === 'gerar') {
      const systemPrompt = `
Você é a Kai, uma IA especialista em OKRs.

Sua tarefa é gerar uma estrutura de OKRs em formato JSON e, depois, explicar a estrutura em texto claro para o usuário.

1. Ao receber o modo "gerar":
  - GERE primeiro o JSON na estrutura abaixo (sem explicações).
  - Depois, GERE uma explicação textual baseada nesse JSON.

2. Quando o modo for diferente de "gerar", continue a conversa normalmente.

Formato JSON:
{
  "ciclo": {
    "nome": "string",
    "dataInicio": "YYYY-MM-DD",
    "dataFim": "YYYY-MM-DD",
    "temaEstratégico": "string"
  },
  "okrs": [
    {
      "id": "okr-1",
      "objetivo": "string",
      "tipo": "strategic" | "tactical" | "operational",
      "resultadosChave": [
        {
          "texto": "string",
          "tipo": "moonshot" | "roofshot",
          "métrica": "string",
          "valorInicial": number,
          "valorAlvo": number,
          "unidade": "string"
        }
      ]
    }
  ],
  "links": [
    {
      "origem": "okr-1",
      "destino": "okr-2",
      "tipo": "hierarchy"
    }
  ]
}

⚠️ NUNCA inclua explicações no JSON.
⚠️ O primeiro bloco da resposta deve conter apenas o JSON.
⚠️ O segundo bloco deve conter uma explicação clara em linguagem natural da estrutura gerada.
      `.trim();

      const resposta = await openai.createChatCompletion({
        model: 'gpt-4o',
        temperature: 0.4,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      });

      const json = await resposta.json();
      const estruturaString = json?.choices?.[0]?.message?.content;

      if (!estruturaString) {
        console.error('[❌ Resposta da IA está vazia]', json);
        return new Response('Erro ao gerar estrutura JSON', { status: 500 });
      }

      let estruturaJSON;
      try {
        estruturaJSON = JSON.parse(estruturaString);
      } catch (err) {
        console.error('[❌ Falha ao fazer parse do JSON]', estruturaString);
        return new Response('Erro ao interpretar estrutura JSON', { status: 500 });
      }

      const explicacaoResposta = await openai.createChatCompletion({
        model: 'gpt-4o',
        temperature: 0.6,
        stream: false,
        messages: [
          {
            role: 'system',
            content: 'Com base na estrutura abaixo, escreva uma explicação clara e direta dos OKRs para o usuário entender a proposta.',
          },
          {
            role: 'user',
            content: JSON.stringify(estruturaJSON),
          },
        ],
      });

      const explicacao = await explicacaoResposta.json();
      const explicacaoTexto = explicacao?.choices?.[0]?.message?.content ?? '';

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ estrutura: estruturaJSON })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: explicacaoTexto })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Conversa normal
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      temperature: 0.7,
      stream: true,
      messages: [
        { role: 'system', content: 'Você é uma IA especialista em OKRs. Continue a conversa com clareza e objetividade.' },
        ...messages,
      ],
    });

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
                console.error('[Erro ao parsear SSE]', e);
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
  } catch (err: any) {
    console.error('[❌ ERRO INTERNO kai-chat]', err.message || err);
    return new Response('Erro interno no processamento da função Kai.', { status: 500 });
  }
}
