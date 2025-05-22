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
  let currentKR: any = null;
  let okrCount = 0;

  for (const line of lines) {
    const clean = line.replace(/^[-#*\s]+/, '').trim();

    // Ciclo
    if (/^Nome do Ciclo:/i.test(clean)) {
      ciclo.nome = clean.replace(/^Nome do Ciclo:/i, '').replace(/^\*\*/, '').trim();
    } else if (/^Data de In[ií]cio:/i.test(clean)) {
      ciclo.dataInicio = extrairDatas(clean);
    } else if (/^Data de Fim:/i.test(clean)) {
      ciclo.dataFim = extrairDatas(clean);
    } else if (/^Tema:/i.test(clean)) {
      ciclo.temaEstratégico = clean.replace(/^Tema:/i, '').trim();
    }

    // Objetivo
    else if (/^\*\*?Objetivo (Estratégico|Tático|Operacional) \d+:/i.test(clean)) {
      if (currentOKR) okrs.push(currentOKR);
      okrCount++;
      const match = clean.match(/^\*\*?Objetivo (.*?)(?: \d+)?:\s*(.+)/i);
      if (!match) continue;
      const tipo = normalizarTipoObjetivo(match[1]);
      const texto = match[2].replace(/^\*\*/, '').trim();
      currentOKR = {
        id: `okr-${okrCount}`,
        objetivo: texto,
        tipo,
        resultadosChave: []
      };
    }

    // Resultado-Chave (linha principal)
    else if (/^(\*\*?)?Resultado-Chave/i.test(clean)) {
      const match = clean.match(/Resultado-Chave.*?:\s*(.+)/i);
      if (!match) continue;
      const texto = match[1].replace(/^\*\*/, '').trim();
      currentKR = {
        texto,
        tipo: 'roofshot',
        métrica: '',
        valorInicial: 0,
        valorAlvo: 0,
        unidade: ''
      };
      currentOKR?.resultadosChave.push(currentKR);
    }

    // Subcampo: Tipo
    else if (/^[-*\s]*\*?Tipo:/.test(line)) {
      const tipoTexto = line.replace(/^[-*\s]*\*?Tipo:\*?/i, '').trim();
      if (currentKR) {
        const tipoLower = tipoTexto.toLowerCase();
        currentKR.tipo = tipoLower.includes('crescimento') || tipoLower.includes('moon') ? 'moonshot' : 'roofshot';
      }
    }

    // Subcampo: Métrica
    else if (/^[-*\s]*\*?Métrica:/.test(line)) {
      const metricaTexto = line.replace(/^[-*\s]*\*?Métrica:\*?/i, '').trim();
      if (currentKR) {
        currentKR.métrica = metricaTexto;
      }
    }

    // Subcampo: valores (de ... para ...)
    else if (/de\s+([\d.,R$%]+)\s+para\s+([\d.,R$%]+)/i.test(line)) {
      const valorMatch = line.match(/de\s+([\d.,R$%]+)\s+para\s+([\d.,R$%]+)/i);
      if (valorMatch && currentKR) {
        const vi = valorMatch[1].replace(/[R$\s]/g, '').replace(',', '.');
        const va = valorMatch[2].replace(/[R$\s]/g, '').replace(',', '.');
        currentKR.valorInicial = parseFloat(vi);
        currentKR.valorAlvo = parseFloat(va);
        currentKR.unidade = valorMatch[2].includes('%') ? '%' : valorMatch[2].includes('R$') ? 'R$' : '';
      }
    }

    // Vínculo
    else if (/Objetivo .*?(\d+).*?(->|➝).*?Objetivo .*?(\d+)/i.test(clean)) {
      const match = clean.match(/Objetivo .*?(\d+).*?(?:->|➝).*?Objetivo .*?(\d+)/i);
      if (match) {
        links.push({
          origem: `okr-${match[1]}`,
          destino: `okr-${match[2]}`,
          tipo: 'hierarchy'
        });
      }
    }
  }

  if (currentOKR) okrs.push(currentOKR);
  return { ciclo, okrs, links };
}

