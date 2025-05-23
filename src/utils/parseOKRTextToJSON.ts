export interface ParsedOKRStructure {
  ciclo: {
    nome: string;
    dataInicio: string;
    dataFim: string;
    temaEstratégico: string;
  };
  okrs: {
    id: string;
    objetivo: string;
    tipo: 'strategic' | 'tactical' | 'operational';
    resultadosChave: {
      texto: string;
      tipo: 'moonshot' | 'roofshot';
      métrica: string;
      valorInicial: number;
      valorAlvo: number;
      unidade: string;
    }[];
  }[];
  links: {
    origem: string;
    destino: string;
    tipo: 'hierarchy';
  }[];
}

function normalizarTipoObjetivo(texto: string): 'strategic' | 'tactical' | 'operational' {
  const tipo = texto.toLowerCase();
  if (tipo.includes('estratégico')) return 'strategic';
  if (tipo.includes('tático')) return 'tactical';
  if (tipo.includes('operacional')) return 'operational';
  return 'strategic';
}

function extrairDatas(dataBr: string): string {
  const meses = {
    janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06',
    julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
  };
  const regex = /\b(\d{1,2})º? de ([a-zç]+) de (\d{4})/i;
  const match = dataBr.match(regex);
  if (!match) throw new Error(`Data inválida: ${dataBr}`);
  const dia = match[1].padStart(2, '0');
  const mes = meses[match[2].toLowerCase() as keyof typeof meses];
  const ano = match[3];
  return `${ano}-${mes}-${dia}`;
}

export function parseStructuredTextToJSON(input: string): ParsedOKRStructure {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const ciclo = { nome: '', dataInicio: '', dataFim: '', temaEstratégico: '' };
  const okrs: ParsedOKRStructure['okrs'] = [];
  const links: ParsedOKRStructure['links'] = [];

  let currentOKR: any = null;
  let okrCount = 0;
  let currentKR: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const clean = line.replace(/\s+/g, ' ').replace(/^[-#*\s]+/, '').trim();

    // Ciclo
    if (/^Nome do Ciclo/i.test(clean)) {
      ciclo.nome = clean.replace(/^Nome do Ciclo[:\s]*/i, '').trim();
    } else if (/^Data In[ií]cio/i.test(clean)) {
      ciclo.dataInicio = extrairDatas(clean.replace(/^Data In[ií]cio[:\s]*/i, ''));
    } else if (/^Data Fim/i.test(clean)) {
      ciclo.dataFim = extrairDatas(clean.replace(/^Data Fim[:\s]*/i, ''));
    } else if (/^Tema/i.test(clean)) {
      ciclo.temaEstratégico = clean.replace(/^Tema( Estratégico)?[:\s]*/i, '').trim();
    }

    // Objetivo
    else if (/^Objetivo \d+ \((Estratégico|Tático|Operacional)\):/i.test(clean)) {
      if (currentOKR) okrs.push(currentOKR);
      okrCount++;
      const match = clean.match(/^Objetivo (\d+) \((.*?)\):\s*(.+)/i);
      if (!match) continue;
      const tipo = normalizarTipoObjetivo(match[2]);
      const texto = match[3];
      currentOKR = {
        id: `okr-${okrCount}`,
        objetivo: texto.trim(),
        tipo,
        resultadosChave: []
      };
    }

    // KR principal
   else if (/^Resultado-Chave \d+(\.\d+)? \((moonshot|roofshot)\):/i.test(clean)) {
    const match = clean.match(/^Resultado-Chave \d+(\.\d+)? \((.*?)\):\s*(.+)/i);
    if (!match) continue;
    currentKR = {
      texto: match[3].trim(),
      tipo: match[2].toLowerCase() === 'moonshot' ? 'moonshot' : 'roofshot',
      métrica: '',
      valorInicial: 0,
      valorAlvo: 0,
      unidade: ''
    };
    currentOKR?.resultadosChave.push(currentKR);
  }
    else if (/^Valor Inicial:/i.test(clean)) {
      const valor = parseFloat(clean.replace(/^Valor Inicial:/i, '').replace(/[R$\s]/g, '').replace(',', '.'));
      if (currentKR && !isNaN(valor)) currentKR.valorInicial = valor;
    }

    else if (/^Valor Alvo:/i.test(clean)) {
      const valor = parseFloat(clean.replace(/^Valor Alvo:/i, '').replace(/[R$\s]/g, '').replace(',', '.'));
      if (currentKR && !isNaN(valor)) currentKR.valorAlvo = valor;
    }

    else if (/^Unidade:/i.test(clean)) {
      const unidadeTexto = clean.replace(/^Unidade:/i, '').trim();
      if (currentKR) currentKR.unidade = unidadeTexto;
    }

    // Subcampos do KR (seguem após o KR principal)
    else if (/^\*\*?Tipo:\*\*/i.test(line)) {
      const tipoTexto = line.replace(/^\s*[-*\s]*\*?Tipo:\*?/i, '').trim();
      if (currentKR) {
        currentKR.tipo = tipoTexto.toLowerCase().includes('moon') || tipoTexto.toLowerCase().includes('crescimento') ? 'moonshot' : 'roofshot';
      }
    }

    else if (/^Métrica:/i.test(clean)) {
      const metricaTexto = clean.replace(/^Métrica:\s*/i, '').trim();
      if (currentKR) currentKR.métrica = metricaTexto;
    }

    // Vínculo
    else if (/^Origem:/i.test(clean)) {
      const origem = clean.replace(/^Origem:\s*/i, '').trim();
      const destino = lines[i + 1]?.replace(/^Destino:\s*/i, '').trim();
      if (origem && destino) {
        links.push({
          origem,
          destino,
          tipo: 'hierarchy'
        });
      }
    }
  }

  if (currentOKR) okrs.push(currentOKR);
  return { ciclo, okrs, links };
}
