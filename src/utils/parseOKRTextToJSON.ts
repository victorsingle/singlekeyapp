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

  const ciclo = { nome: '', dataInicio: '', dataFim: '', temaEstratégico: '' };
  const okrs: ParsedOKRStructure['okrs'] = [];
  const links: ParsedOKRStructure['links'] = [];

  let currentOKR: any = null;
  let okrCount = 0;

  for (const line of lines) {

    const nomeCicloMatch = line.match(/\*\*Nome do Ciclo:\*\*[:\s]*([^\*]+)/i);
    if (nomeCicloMatch) {
      ciclo.nome = nomeCicloMatch[1].trim();
    } else if (/\*\*Período:\*\*/.test(line)) {
      const datas = line.replace(/\*\*Período:\*\*/, '').split(' a ');
      if (datas.length === 2) {
        ciclo.dataInicio = extrairDatas(datas[0].trim());
        ciclo.dataFim = extrairDatas(datas[1].trim());
      }
    } else if (/\*\*Tema Estratégico:\*\*/.test(line)) {
      ciclo.temaEstratégico = line.replace(/\*\*Tema Estratégico:\*\*/, '').trim();
    }

    else if (/^\*\*Objetivo \d+:/.test(line)) {
      if (currentOKR) okrs.push(currentOKR);
      okrCount++;
      const match = line.match(/\*\*Objetivo (\d+): (.*)\*\*/);
      if (!match) throw new Error(`Objetivo mal formatado: ${line}`);
      currentOKR = {
        id: `okr-${match[1]}`,
        objetivo: match[2].trim(),
        tipo: 'strategic',
        resultadosChave: []
      };
    }

    else if (/^\- \*\*Resultado-Chave \d+ \((.*?)\):/.test(line)) {
      const match = line.match(/\*\*Resultado-Chave \d+ \((.*?)\):\*\* (.*)/);
      if (!match) throw new Error(`KR mal formatado: ${line}`);
      const tipo = normalizarTipoKR(match[1]);
      const texto = match[2].trim();

      let valorInicial = 0;
      let valorAlvo = 0;
      let unidade = '';
      let metrica = '';

      const valorMatch = texto.match(/de\s+([\d,.R$%]+)\s+para\s+([\d,.R$%]+)/i);
      if (valorMatch) {
        const vi = valorMatch[1].trim().replace(/[R$\s]/g, '').replace(',', '.');
        const va = valorMatch[2].trim().replace(/[R$\s]/g, '').replace(',', '.');
        valorInicial = parseFloat(vi);
        valorAlvo = parseFloat(va);
        unidade = valorMatch[2].includes('%') ? '%' : valorMatch[2].includes('R$') ? 'R$' : '';
      }

      const metricaMatch = texto.match(/(aumentar|elevar|reduzir|incrementar|diminuir|conquistar|alcançar)\s+([a-zç\s]+)/i);
      if (metricaMatch) metrica = metricaMatch[2].trim();

      currentOKR?.resultadosChave.push({
        texto,
        tipo,
        métrica: metrica,
        valorInicial,
        valorAlvo,
        unidade
      });
    }

    else if (/Objetivo \d+.*(deriva|relacionado|vinculado).*Objetivo \d+/i.test(line)) {
      const linkMatch = line.match(/Objetivo (\d+).*?(?:deriva|relacionado|vinculado).*Objetivo (\d+)/i);
      if (linkMatch) {
        links.push({
          origem: `okr-${linkMatch[1]}`,
          destino: `okr-${linkMatch[2]}`,
          tipo: 'hierarchy'
        });
      }
    }
  }

  if (currentOKR) okrs.push(currentOKR);

  return { ciclo, okrs, links };
}
