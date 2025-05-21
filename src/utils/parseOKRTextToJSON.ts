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
  throw new Error(`Tipo de objetivo inválido: ${texto}`);
}

function normalizarTipoKR(texto: string): 'moonshot' | 'roofshot' {
  const tipo = texto.toLowerCase();
  if (tipo.includes('moonshot')) return 'moonshot';
  if (tipo.includes('roofshot')) return 'roofshot';
  throw new Error(`Tipo de KR inválido: ${texto}`);
}

function extrairDatas(dataBr: string): string {
  const meses = {
    janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06',
    julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
  };
  const regex = /\b(\d{1,2}) de ([a-zç]+) de (\d{4})/i;
  const match = dataBr.match(regex);
  if (!match) throw new Error(`Data inválida: ${dataBr}`);
  const dia = match[1].padStart(2, '0');
  const mes = meses[match[2].toLowerCase() as keyof typeof meses];
  const ano = match[3];
  return `${ano}-${mes}-${dia}`;
}

export function parseStructuredTextToJSON(input: string): ParsedOKRStructure {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const ciclo: ParsedOKRStructure['ciclo'] = {
    nome: '', dataInicio: '', dataFim: '', temaEstratégico: ''
  };
  const okrs: ParsedOKRStructure['okrs'] = [];
  const links: ParsedOKRStructure['links'] = [];

  let currentOKR: any = null;
  let okrCount = 0;

  for (const line of lines) {
    if (line.startsWith('Nome do Ciclo:')) ciclo.nome = line.replace('Nome do Ciclo:', '').trim();
    else if (line.startsWith('Data Início:')) ciclo.dataInicio = extrairDatas(line);
    else if (line.startsWith('Data Fim:')) ciclo.dataFim = extrairDatas(line);
    else if (line.startsWith('Tema Estratégico:')) ciclo.temaEstratégico = line.replace('Tema Estratégico:', '').trim();

    else if (line.startsWith('Objetivo')) {
      if (currentOKR) okrs.push(currentOKR);
      okrCount++;
      const match = line.match(/Objetivo \d+ \((.*?)\): (.*)/i);
      if (!match) throw new Error(`Objetivo mal formatado: ${line}`);
      currentOKR = {
        id: `okr-${okrCount}`,
        objetivo: match[2].trim(),
        tipo: normalizarTipoObjetivo(match[1].trim()),
        resultadosChave: []
      };
    }
    else if (line.startsWith('KR')) {
      const match = line.match(/KR \d+ \((.*?)\): (.*)/i);
      if (!match) throw new Error(`KR mal formatado: ${line}`);
      currentOKR?.resultadosChave.push({
        texto: match[2].trim(),
        tipo: normalizarTipoKR(match[1].trim()),
        métrica: '',
        valorInicial: 0,
        valorAlvo: 0,
        unidade: ''
      });
    }
  }

  if (currentOKR) okrs.push(currentOKR);

  return { ciclo, okrs, links };
}
