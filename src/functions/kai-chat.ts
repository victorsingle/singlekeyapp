import { Configuration, OpenAIApi } from 'openai-edge';
import { NextRequest } from 'next/server';

const openaiConfig = new Configuration({
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
- NÃO gere proposta de OKRs até ter contexto suficiente (área, escopo, foco do ciclo).
- Ao gerar, sempre entregue a estrutura COMPLETA: ciclo, objetivos, tipo, KRs.
- Ao receber ajustes, reescreva tudo de novo, sem deixar partes antigas.
- Nunca mostre JSON para o usuário. Fale em linguagem natural e estruturada.
- Ao invés do JSON, mostre o texto estruturado com marcações para demonstrar como ficarão os OKRs.
- Pergunte antes de agir. Confirme se deve prosseguir.
- Seja leve, sem exagero nas firulas.
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
      response_format: 'json_object',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    const json = await completion.json();
    const content = json?.choices?.[0]?.message?.content ?? '[❌ Erro: resposta vazia da IA]';
    return new Response(JSON.stringify(content));
  }

  // Modos "conversa" e "gerar"
  const completion = await openai.createChatCompletion({
  model: 'gpt-4o',
  temperature: 0.6,
  messages: [
    { role: 'system', content: systemPromptBase },
    ...messages,
  ],
});

const json = await completion.json();

if (!json || !json.choices || !json.choices[0] || !json.choices[0].message) {
  console.error('[❌ Erro: resposta inválida da IA]', JSON.stringify(json, null, 2));
  return new Response(JSON.stringify('[❌ A IA não conseguiu gerar a proposta. Tente novamente.]'));
}

const content = json.choices[0].message.content?.trim();

if (!content) {
  console.error('[❌ Erro: resposta vazia da IA]', JSON.stringify(json, null, 2));
  return new Response(JSON.stringify('[❌ A IA respondeu com conteúdo vazio. Tente reformular seu prompt.]'));
}

return new Response(JSON.stringify(content));
}
