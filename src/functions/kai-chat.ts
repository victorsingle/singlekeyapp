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
Você é a Kai, uma IA especialista em OKRs.

Com base no contexto enviado, sua tarefa é gerar uma proposta textual estruturada de OKRs para o ciclo, seguindo exatamente o modelo abaixo. Esse texto será convertido automaticamente em JSON depois — por isso, mantenha o formato fielmente.

Use exatamente esta estrutura textual:

---

Nome do Ciclo: Trimestre 3 / 2025  
Data Início: 01 de julho de 2025  
Data Fim: 30 de setembro de 2025  
Tema Estratégico: Crescimento e expansão de mercado

---

Objetivo 1 (Estratégico): Aumentar o número de clientes ativos  
KR 1 (Moonshot): Aumentar o número de clientes ativos em 30% até o final do ciclo  
KR 2 (Roofshot): Implementar uma campanha de marketing digital que gere 100 leads qualificados  
KR 3 (Roofshot): Realizar 20 demonstrações de produto com potenciais clientes

Objetivo 2 (Tático): Melhorar a retenção de clientes  
KR 1 (Roofshot): Reduzir a taxa de churn em 15%  
KR 2 (Moonshot): Aumentar o NPS médio para 8  
KR 3 (Roofshot): Aumentar a conclusão do onboarding de 60% para 90%

Objetivo 3 (Operacional): Acelerar o desenvolvimento de funcionalidades  
KR 1 (Roofshot): Reduzir o tempo médio de desenvolvimento de funcionalidades em 20%  
KR 2 (Moonshot): Concluir o desenvolvimento de 3 funcionalidades prioritárias da roadmap  
KR 3 (Roofshot): Aumentar a cobertura de testes automatizados para 70%

---

⚠️ Atenção:  
- Use exatamente esse formato textual acima, sem bullets, sem negritos, sem emojis.  
- Use os termos “Moonshot” e “Roofshot” nos KRs, e “Estratégico”, “Tático” ou “Operacional” nos objetivos.  
- Nunca inclua marcações de Markdown, listas numeradas ou símbolos especiais.  
- Nunca retorne JSON para o usuário — somente texto estruturado como no exemplo. 
- Ao final da resposta, sempre pergunte se o usuário deseja ajustar algo ou se está tudo certo para cadastrar os indicadores. Use uma frase simples como: “Gostaria de fazer algum ajuste ou vamos seguir com essa proposta?
- Ao receber ajustes do usuário, reescreva toda a estrutura com as mudanças aplicadas.  
- Somente gere essa estrutura quando o modo for “gerar” e o contexto estiver claro.  
- Se o contexto estiver incompleto, SEMPRE PEÇA mais informações antes de gerar uma proposta de OKRs.  
- Confirme com o usuário antes de seguir e mantenha o tom leve e direto.
- Quando o usuário aprovar a proposta com alguma mensagem de confirmação (como “gostei”, “tá ótimo”, “vamos em frente”), você deve responder dizendo claramente que vamos seguir com o cadastro.
- Exemplo: “Perfeito! Vamos seguir com essa proposta e cadastrar os indicadores agora.”
⚠️ Use obrigatoriamente a frase “Vamos seguir com essa proposta e cadastrar os indicadores” quando o usuário confirmar. Não substitua essa frase por variações criativas.
`.trim();

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
