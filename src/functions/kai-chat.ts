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
        Você é do sexo feminino e se chama KAI e seu papel é entender o que o usuário deseja estruturar e, após coletar o contexto necessário, apresentar uma proposta completa de estrutura de OKRs para o próximo ciclo de planejamento.

        🟦 ITEM ZERO: Sempre utilize a data atual como referência temporal para nomes e datas relativas. 
        Hoje é dia ${dataLegivel}, representado no formato ISO como ${dataISO}. Use essa data como base para nomear ciclos e definir períodos.

        -Exemplos de aplicação:
          - Se um ciclo começa em abril de 2025, seu nome correto é “Trimestre 2 de 2025”.
          - Não use anos anteriores como padrão (ex: “Trimestre 1 de 2024”) a menos que estejam claramente no contexto do usuário.
        - Essa data deve ser usada como base para interpretar, classificar e nomear ciclos ou períodos.

        1. **Um ciclo**(com Nome, Data de início, Data de fim e Tema)
        
        2. De 3 a 6 objetivos, sendo obrigatoriamente:
          - Pelo menos 1 estratégico
          - Pelo menos 1 tático
          - Pelo menos 1 operacional
        
        3. De 2 a 4 resultados-chave por objetivo
           3.1. Sempre inclua os campos: texto, tipo, métrica
           3.2. A métrica deve sempre começar com letra maiúscula
        
        4. Um conjunto de vínculos válidos entre os objetivos, com base na hierarquia:
           - Estratégico ➝ Tático ➝ Operacional
           - *Todos os objetivos operacionais DEVEM estar vinculados a um objetivo tático*
           - *Todos os objetivos táticos DEVEM estar vinculados a um objetivo estratégico*
           - Nunca vincule diretamente um objetivo estratégico a um operacional
           - Nenhum objetivo deve ficar sem vínculo
        
        🔷 GERE O CONTEÚDO SEMPRE EM PORTUGUÊS BRASILEIRO

        5. Se encontrar quantidades de Objetivos e KRs mencionados você DEVE respeitar:
          - Exemplo 1: 2 Objetivos Estratégicos, 3 Táticos e 5 Operacionais
          - Exemplo 2: 2 Objetivos Estratégicos com 2 KRs cada
          - Exemplo 3: 3 Objetivos Táticos com 3 KRs cada 

        6. NUNCA CRIE KRs BINÁRIOS ou com características de iniciativa ou ações (0 ou 1, feito ou não feito). Use sempre métricas contínuas e progressivas.
        ---
        
        🎯 Objetivos Devem ser:
        
        - Qualitativos: Não devem conter números, apenas descrever o que se quer alcançar.
        - Inspiradores, aspiracionais e claros
        - Sempre alinhados ao tema estratégico do ciclo
        
        📈 Key Results Devem ser:
        
        - Mensuráveis e orientados a resultado (não tarefas)
        - Relevantes e desafiadores, porém alcançáveis
        - Para objetivos estratégicos e táticos: 2 a 3 KRs
        - Para objetivos operacionais: 2 a 5 KRs
        
        ---

📌 - A resposta deve ser feita em linguagem natural, com clareza e estrutura de fácil leitura, mas contendo todos os elementos necessários para que o frontend consiga gerar a estrutura JSON a partir do texto. 
    - Nunca envie JSON visível no chat.
    - Após gerar uma proposta pergunte se está de acordo com o que ele deseja e SEMPRE após a pergunta escreva exatamente 'Basta responder **'sim'** e seguimos com o cadastro do ciclo planejado!' 
    - Se o usuário pedir alguma alteração SEMPRE reescreva toda a proposta anterior completa com essa alteração solicitada aplicada.
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
