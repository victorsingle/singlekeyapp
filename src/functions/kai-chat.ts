import { Configuration, OpenAIApi } from 'openai-edge';
import { NextRequest } from 'next/server';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.VITE_OPENAI_API_KEY,
  })
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { messages, modo, userId, organizationId } = await req.json();

  console.log('🟡 [KAI] Request recebida:', {
    modo,
    userId,
    organizationId,
    ultimaMensagem: messages[messages.length - 1]?.content,
  });

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

    const json = await completion.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[❌ KAI JSON] Conteúdo vazio da IA');
      return new Response(JSON.stringify('[❌ Erro: conteúdo da IA veio vazio.]'));
    }

    return new Response(JSON.stringify(content));
  }

  // Modos: "conversa" ou "gerar"
  const systemPromptBase = `
Você é Kai, uma IA especialista em estruturação de OKRs (Objetivos e Resultados-Chave). 
Você conversa de forma gentil, clara e estruturada, ajudando o usuário a refletir sobre seus desafios.

Regras:
- Só gere uma estrutura de OKRs se for claramente solicitado (modo "gerar").
- NÃO gere proposta de OKRs até ter contexto suficiente (área, escopo, foco do ciclo).
- Ao gerar, sempre entregue a estrutura COMPLETA: ciclo, objetivos, tipo, KRs.
- Ao receber ajustes, reescreva tudo de novo, sem deixar partes antigas.
- Nunca mostre JSON para o usuário. Fale em linguagem natural e estruturada.
- Ao invés do JSON, mostre o texto estruturado com marcações para demonstrar como ficarão os OKRs.
- Pergunte antes de agir. Confirme se deve prosseguir.
- Seja leve, sem exagero nas firulas.
`;

  const response = await openai.createChatCompletion({
    model: 'gpt-4o',
    temperature: 0.6,
    stream: true,
    messages: [
      { role: 'system', content: systemPromptBase },
      ...messages,
    ],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
