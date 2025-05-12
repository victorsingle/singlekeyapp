import React, { useEffect, useState } from 'react';
import RadarLoader from '../RadarLoader';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useAuthStore } from '../../stores/authStore';
import { useOKRStore } from '../../stores/okrStore';
import { CycleProgress } from './CycleProgress';
import { TypeProgress } from './TypeProgress';
import { ObjectiveTypeProgress } from './ObjectiveTypeProgress';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { CycleComparison } from './CycleComparison';
import { MatrizPlacar } from './MatrizPlacar';
import { DetailPanel } from './DetailPanel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SubHeader } from '../SubHeader';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { TeamScoreboard } from './TeamScoreboard';

export function Dashboard() {
  const {
    cycles,
    selectedCycleId,
    setSelectedCycleId,
    loadCycles,
    loadOKRs,
    fetchOKRs,
    okrs,
    keyResults,
    links,
    loadAllOKRs,
    teams,
  } = useOKRStore();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState('');
  const [panelTitle, setPanelTitle] = useState('');
  const openPanel = (type: string, title: string) => {
    setPanelType(type);
    setPanelTitle(title);
    setPanelOpen(true);
  };

  const { isAdmin, isChampion } = usePermissions();

  console.log('Permissões:', { isAdmin, isChampion });

  const { organizationId } = useAuthStore();

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);
  const breadcrumbItems = [
    { label: 'Ciclos', href: '/cycles' },
    selectedCycle
      ? { label: selectedCycle.name, href: `/cycle/${selectedCycle.id}` }
      : { label: '...' },
    { label: 'Acompanhamento' },
  ];
  const navigate = useNavigate();
  const location = useLocation();


// [1] Carrega ciclos e define ciclo selecionado
useEffect(() => {
  if (!organizationId) return;

  const run = async () => {
    await loadCycles(organizationId);
    const freshCycles = useOKRStore.getState().cycles;

    // Procura o ciclo ativo primeiro
    const activeCycle = freshCycles.find(cycle => cycle.status === 'active');
    const first = activeCycle ?? freshCycles.at(-1);

    if (first) {
      setSelectedCycleId(first.id);
      await loadOKRs(organizationId, first.id);
      await loadPlacarData(organizationId, first.id);
    }
  };

  run();
}, [organizationId]);

useEffect(() => {
  if (!organizationId) return;
  useOKRStore.getState().loadTeams(organizationId);
}, [organizationId]);

// [2] Carrega todos os OKRs (usado no gráfico comparativo)
useEffect(() => {
  console.log('[🧪 useEffect - tentando carregar todos os OKRs]', { organizationId });

  if (!organizationId) return;

  const run = async () => {
    console.log('[🧪 Chamando loadAllOKRs...]');
    await loadAllOKRs(organizationId);
  };

  run();
}, [organizationId]);

useEffect(() => {
  if (!organizationId || !selectedCycleId) return;

  const run = async () => {
    await loadOKRs(organizationId, selectedCycleId);

    // 🔧 Adiciona carregamento manual dos Key Results
    const okrs = useOKRStore.getState().okrs;
    for (const okr of okrs) {
      await useOKRStore.getState().loadKeyResults(okr.id);
    }

    await loadPlacarData(organizationId, selectedCycleId);
  };

  run();
}, [organizationId, selectedCycleId]);

// 📊 Matriz do Placar: montar dados e datas
const placarData = useDashboardStore(state => state.placarData);
const allDates = useDashboardStore(state => state.allDates);
const loadPlacarData = useDashboardStore(state => state.loadPlacarData);

  useEffect(() => {
    if (!organizationId || !selectedCycleId) return;
    loadPlacarData(organizationId, selectedCycleId);
  }, [organizationId, selectedCycleId]);


  // Agrupamento manual de KRs por time
const teamsMap = new Map(); // team_id → { id, name }
const teamKRMap = new Map(); // team_id → [keyResults[]]

if (!Array.isArray(keyResults) || !Array.isArray(okrs) || !Array.isArray(teams)) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <RadarLoader />
    </div>
  );
}

keyResults.forEach((kr) => {
  const { id, text, initial_value, target_value, progress, unit, okr_id } = kr;
  const team_ids = kr.team_ids ?? []; // <-- extrai aqui com fallback

  const okr = okrs.find(o => o.id === okr_id && o.cycle_id === selectedCycleId);
  const nivel = okr?.type ?? '-';

  team_ids.forEach((teamId) => {
    if (!teamKRMap.has(teamId)) teamKRMap.set(teamId, []);
    teamKRMap.get(teamId).push({
      id,
      texto: text,
      nivel,
      baseline: initial_value?.toString() ?? '-',
      target: target_value?.toString() ?? '-',
      progresso: parseFloat((progress ?? 0).toFixed(1)),
    });
  });
});

console.log('[DEBUG] keyResults sample', keyResults.map(kr => ({
  id: kr.id,
  text: kr.text,
  team_ids: kr.team_ids
})));

console.log('[DEBUG] Comparando times e team_ids dos KRs:', {
  timesNaStore: teams.map(t => t.id),
  timesNosKRs: keyResults.flatMap(k => k.team_ids)
});

// Mapeia os times válidos com nome
teams.forEach((team) => {
  if (teamKRMap.has(team.id)) {
    teamsMap.set(team.id, team.name);
  }
});

// Gera estrutura final para <TeamScoreboard />
const teamScoreboardData = Array.from(teamKRMap.entries()).map(([teamId, keyResults]) => ({
  teamName: teamsMap.get(teamId) ?? 'Sem time',
  keyResults,
}));

console.log('[🧪 DEBUG] Dados do placar por time (teamScoreboardData):', teamScoreboardData);
  return (
    <>
      {selectedCycle && (
        <SubHeader
          breadcrumb={[
            { label: 'Ciclos', href: '/cycles' },
            { label: selectedCycle.name, href: `/cycle/${selectedCycle.id}` },
            { label: 'Acompanhamento' }
          ]}
          title= {`Acompanhamento de ${selectedCycle.name}`}
          badge={
            selectedCycle.status === 'active'
              ? 'Ativo'
              : selectedCycle.status === 'completed'
              ? 'Concluído'
              : 'Rascunho'
          }
          badgeClassName={
            selectedCycle.status === 'active'
              ? 'bg-yellow-100 text-yellow-800'
              : selectedCycle.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-800'
          }
          period={
            selectedCycle.start_date && selectedCycle.end_date
              ? `${format(new Date(`${selectedCycle.start_date}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} até ${format(new Date(`${selectedCycle.end_date}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
              : 'Período inválido'
          }
        />
      )}
  
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          {!selectedCycle && (
            
            <div className="w-full h-[70vh] flex justify-center items-center px-6 text-center">
              <div className="w-full max-w-lg">

              {(isAdmin || isChampion) ? (
                <>
                <h1 className="w-full text-4xl font-bold text-gray-900 tracking-tight mb-3">
                  Nenhum <span className="text-blue-600">Ciclo de OKRs</span> para acompanhar no momento.
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                  Comece seu planejamento com a ajuda da <b className="text-blue-600">KAI</b> e construa o próximo ciclo.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 hover:shadow-xl transition"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                 Criar novo ciclo
                </button>
                </>
              ):(
                <>
                <h1 className="w-full text-4xl font-bold text-gray-900 tracking-tight mb-3">
                Nenhum <span className="text-blue-600">Ciclo de OKRs</span> para acompanhar no momento.
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                Assim que seu Champion iniciar um novo ciclo você poderá acompanhar o progresso dos objetivos com mais clareza e foco.
                </p>
                </>
              )}

              </div>
            </div>

          )}
  
          {selectedCycle && (
            <div className="relative w-full md:w-auto">
            <select
              className="appearance-none border px-4 py-2 pr-10 rounded-xl w-full"
              value={selectedCycleId ?? ''}
              onChange={(e) => setSelectedCycleId(e.target.value)}
            >
              <option value="" disabled>Selecione um ciclo</option>
              {cycles.map(cycle => (
                <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
              ))}
            </select>
          
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          </div>
          )}
        </div>
  
        {selectedCycle && (
          <div className="p-0 space-y-8">
            {/* Linha 1: 4 widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="min-h-[160px]"><CycleProgress /></div>
              <div className="min-h-[160px]">
                <ObjectiveTypeProgress
                  onTypeClick={(type) =>
                    openPanel(
                      type,
                      `Objetivos ${type === 'strategic' ? 'Estratégicos' : type === 'tactical' ? 'Táticos' : 'Operacionais'}`
                    )
                  }
                />
              </div>
              <div className="min-h-[160px]">
                <TypeProgress
                  onTypeClick={(type) =>
                    openPanel(type, type === 'moonshot' ? 'Moonshots' : 'Roofshots')
                  }
                />
              </div>
              <div className="min-h-[160px]">
                <ConfidenceIndicator
                  onConfidenceClick={(level) =>
                    openPanel(level, {
                      high: 'Alta confiança',
                      medium: 'Média confiança',
                      low: 'Baixa confiança',
                    }[level])
                  }
                />
              </div>
            </div>
          
           {/* Linha 2: Matriz do Placar */}
           {allDates.length > 0 && (
              <div className="grid grid-cols-1">
                <MatrizPlacar data={placarData} dates={allDates} />
              </div>
            )}
           
           {/* Linha 2.1: Matriz de Time */}
           {teamScoreboardData.length > 0 && (
              <div className="grid grid-cols-1">
                <TeamScoreboard data={teamScoreboardData} />
              </div>
            )}

            {/* Linha 3: gráfico comparativo */}
            <div className="grid grid-cols-1">
              <CycleComparison />
            </div>
  
            {/* Painel lateral */}
            {panelOpen && (
              <DetailPanel
                title={panelTitle}
                type={panelType}
                onClose={() => setPanelOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

