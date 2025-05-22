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
    const { messages, modo } = await req.json();
    const encoder = new TextEncoder();

    if (modo === 'gerar') {
      const systemPrompt = `
Você é a Kai, uma IA especialista em OKRs.

Você receberá abaixo um TEXTO JÁ VALIDADO PELO USUÁRIO contendo a estrutura final de OKRs aprovada por ele.

⚠️ Sua única tarefa é CONVERTER esse conteúdo em formato JSON, seguindo a estrutura abaixo, sem alterar absolutamente nada.

⚠️ O JSON deve estar no formato a seguir, e deve ser o ÚNICO conteúdo da sua resposta — sem introduções, comentários, ou formatação \`\`\`.

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
`.trim();

      const resposta = await openai.createChatCompletion({
        model: 'gpt-4o',
        temperature: 0,
        stream: false,
        response_format: 'json',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      });

      const raw = await resposta.json();
      const content = raw?.choices?.[0]?.message?.content;

      let estruturaJSON;
      try {
        estruturaJSON = JSON.parse(content);
      } catch (e) {
        console.error('[❌ Erro ao interpretar JSON puro retornado]', content);
        return new Response('Erro ao interpretar JSON puro da estrutura', { status: 500 });
      }

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ json: estruturaJSON })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        }
      });
    }

    // modo conversa (streaming natural)
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      temperature: 0.7,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `
Você é a Kai, uma agente conversacional especialista em OKRs.

Seu papel é entender o que o usuário deseja estruturar, fazer perguntas para esclarecer o contexto, e só então propor OKRs.

⚠️ Quando a estrutura estiver pronta e o usuário confirmar, você pode responder com a explicação textual da proposta. O JSON deve ser enviado apenas internamente, nunca visível no chat.
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
              console.error('[❌ Erro ao parsear streaming da conversa]', e);
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
