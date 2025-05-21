import { Configuration, OpenAIApi } from 'openai-edge';
import { NextRequest } from 'next/server';

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.VITE_OPENAI_API_KEY,
  })
);

export const config = { runtime: 'edge' };

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

⚠️ Nunca inclua explicações no JSON.
⚠️ O primeiro bloco da resposta deve conter apenas o JSON.
⚠️ O segundo bloco deve conter uma explicação clara e objetiva da estrutura gerada.
⚠️ SEMPRE que o usuário confirmar que deseja gerar a proposta final — ou solicitar qualquer ajuste na proposta anterior —, você deve REGERAR a estrutura COMPLETA em formato JSON, refletindo todas as alterações solicitadas.
⚠️ Após o JSON, você deve escrever uma explicação textual clara e objetiva da nova proposta.
⚠️ Não espere outro comando. Gere a nova proposta automaticamente assim que a intenção do usuário for confirmada.
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

      const raw = await resposta.json();
      const fullResponse = raw?.choices?.[0]?.message?.content;
      if (!fullResponse) return new Response('Erro ao gerar estrutura JSON', { status: 500 });

      let estruturaJSON = null;
      let explicacaoTexto = '';

      try {
        const match = fullResponse.match(/```json\s*([\s\S]+?)\s*```/);
        if (!match || !match[1]) throw new Error('Bloco JSON não encontrado');

        const jsonStr = match[1].trim();
        estruturaJSON = JSON.parse(jsonStr);

        explicacaoTexto = fullResponse.replace(match[0], '').trim() +
          '\n\nEstá de acordo? Se quiser ajustar algo, é só dizer!';
      } catch (err) {
        console.error('[❌ Falha ao parsear estrutura JSON]', fullResponse);
        return new Response('Erro ao interpretar estrutura JSON gerada', { status: 500 });
      }

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ json: estruturaJSON })}\n\n`));
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

    // modo conversa
    const systemPromptConversa = `
Você é a Kai, uma agente conversacional especialista em OKRs.

Seu papel é entender o que o usuário deseja estruturar, fazer perguntas para esclarecer o contexto, e só então propor OKRs.

⚠️ Quando a estrutura estiver pronta e o usuário confirmar, você deve RESPONDER da seguinte forma:

1. Envie a estrutura de OKRs apenas internamente, como um objeto JSON no padrão abaixo — sem exibir no chat.
2. No chat, envie apenas a EXPLICAÇÃO textual da proposta de forma clara, natural e objetiva — sem nenhum bloco de código, sem formatação \`\`\`, e sem mostrar o JSON.

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

⚠️ Nunca mostre esse JSON no chat.
⚠️ Gere os dados automaticamente quando a intenção do usuário estiver clara.
`.trim();

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      temperature: 0.7,
      stream: true,
      messages: [
        { role: 'system', content: systemPromptConversa },
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
            if (!line.startsWith('data:')) continue;

            const jsonStr = line.replace('data: ', '');
            if (jsonStr === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(jsonStr);

              if (parsed.json) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ json: parsed.json })}\n\n`));
              }

              if (parsed.choices?.[0]?.delta?.content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: parsed.choices[0].delta.content })}\n\n`));
              }
            } catch (e) {
              console.error('[Erro ao parsear SSE]', e);
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
  } catch (err) {
    console.error('[❌ ERRO INTERNO kai-chat]', err);
    return new Response('Erro interno no processamento da função Kai.', { status: 500 });
  }
}
