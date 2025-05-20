import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextRequest } from 'next/server';

const openaiConfig  = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { messages, modo, userId, organizationId } = await req.json();

  const systemPromptBase = `
Você é Kai, uma IA especialista em estruturação de OKRs (Objetivos e Resultados-Chave). 
Você conversa de forma gentil, clara e estruturada, ajudando o usuário a refletir sobre seus desafios.

Regras:
- Só gere uma estrutura de OKRs se for claramente solicitado (modo "gerar").
- Ao gerar, sempre entregue a estrutura COMPLETA: ciclo, objetivos, tipo, KRs, métricas (se mencionados).
- Ao receber ajustes, reescreva tudo de novo, sem deixar partes antigas.
- Nunca mostre JSON para o usuário. Fale em linguagem natural e estruturada.
- Pergunte antes de agir. Confirme se deve prosseguir.
- Seja leve, sem exagero nos emojis ou nas firulas.
`;

  if (modo === 'json') {
    const systemPrompt = `
Você é Kai, uma IA especializada em estruturar OKRs para cadastro no sistema.

Receberá abaixo um TEXTO VALIDADO pelo usuário contendo a estrutura de OKRs.

Sua tarefa é CONVERTER esse conteúdo em um JSON exato, respeitando rigorosamente o seguinte formato:

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

⚠️ NÃO EXPLIQUE o que está fazendo.
⚠️ NÃO insira nenhum texto fora do JSON.

Apenas responda com o JSON completo.
`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: 'json',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    const completionJSON = await completion.json();
    return new Response(JSON.stringify(completionJSON.choices[0].message.content));
  }

  // para modos "conversa" e "gerar"
  const completion = await openai.createChatCompletion({
    model: 'gpt-4o',
    temperature: 0.6,
    stream: true,
    messages: [
      { role: 'system', content: systemPromptBase },
      ...messages,
    ],
  });

  const stream = OpenAIStream(completion);
  return new StreamingTextResponse(stream);
}
