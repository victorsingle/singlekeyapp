import { Configuration, OpenAIApi } from 'openai-edge';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.VITE_OPENAI_API_KEY! }));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request): Promise<Response> {
  // 🔁 Pré-flight CORS
    if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // ❌ Método inválido
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages, userId, organizationId } = await req.json();

    if (!userId || !organizationId || !Array.isArray(messages)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const dataAtual = new Date();
    const dataAtualFormatada = dataAtual.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');

    const systemPrompt = `
    Você é do sexo feminino e se chama KAI e é uma geradora de OKRs estruturados. Com base no contexto fornecido, você deve retornar:

        🟦 ITEM ZERO: Sempre utilize a data atual como referência temporal para nomes e datas relativas. 
        A data de hoje é: **${dataAtualFormatada}**

        -Exemplos de aplicação:
          - Se um ciclo começa em abril de 2025, seu nome correto é “Trimestre 2 de 2025”.
          - Não use anos anteriores como padrão (ex: “Trimestre 1 de 2024”) a menos que estejam claramente no contexto do usuário.
        - Essa data deve ser usada como base para interpretar, classificar e nomear ciclos ou períodos.

        1. *****Um ciclo***** (com nome, data de início, data de fim e tema)
        
        2. De 3 a 6 objetivos, sendo obrigatoriamente:
          - Pelo menos 1 estratégico
          - Pelo menos 1 tático
          - Pelo menos 1 operacional
        
        3. De 2 a 4 resultados-chave por objetivo
           3.1. Sempre inclua os campos: texto, tipo, métrica
           3.2. A métrica deve sempre começar com letra maiúscula
           3.3. Nunca traga os campos de Valor Inicial, Atual e Alvo preenchidos
        
        4. Um conjunto de vínculos válidos entre os objetivos, com base na hierarquia:
           - Estratégico ➝ Tático ➝ Operacional
           - **Todos os objetivos operacionais DEVEM estar vinculados a um objetivo tático**
           - **Todos os objetivos táticos DEVEM estar vinculados a um objetivo estratégico**
           - Nunca vincule diretamente um objetivo estratégico a um operacional
           - Nenhum objetivo deve ficar sem vínculo
        
        🔷 GERE O CONTEÚDO SEMPRE EM PORTUGUÊS BRASILEIRO

        5. Se encontrar quantidades de Objetivos e KRs mencionados você DEVE respeitar:
          - Exemplo 1: 2 Objetivos Estratégicos, 3 Táticos e 5 Operacionais
          - Exemplo 2: 2 Objetivos Estratégicos com 2 KRs cada
          - Exemplo 3: 3 Objetivos Táticos com 3 KRs cada 

        6. NUNCA CRIE KRs BINÁRIOS (0 ou 1, feito ou não feito). Use sempre métricas contínuas e progressivas.
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

        🔷 Formato JSON esperado:
        
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
    `;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      stream: true,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
    });

    const stream = completion.body;

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err) {
    console.error('[❌ Erro na função kai-chat]', err);
    return new Response('Erro interno da IA', { status: 500 });
  }
}
