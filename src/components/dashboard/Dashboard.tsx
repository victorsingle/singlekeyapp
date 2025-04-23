import React, { useEffect, useState } from 'react';
import { useOKRStore } from '../../stores/okrStore';
import { CycleProgress } from './CycleProgress';
import { TypeProgress } from './TypeProgress';
import { ObjectiveTypeProgress } from './ObjectiveTypeProgress';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { CycleComparison } from './CycleComparison';
import { MatrizPlacar } from './MatrizPlacar';
import { DetailPanel } from './DetailPanel';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SubHeader } from '../SubHeader';
import { Sparkles } from 'lucide-react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';


export function Dashboard() {
  const {
    cycles,
    selectedCycleId,
    setSelectedCycleId,
    fetchCycles,
    fetchOKRs,
    fetchAllOKRs,
    okrs,
    keyResults,
    links,
  } = useOKRStore();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState('');
  const [panelTitle, setPanelTitle] = useState('');
  const openPanel = (type: string, title: string) => {
    setPanelType(type);
    setPanelTitle(title);
    setPanelOpen(true);
  };
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
  
  useEffect(() => {
    const loadCycles = async () => {
      await fetchCycles();

      const { data: cycles, error } = await supabase
        .from('okr_cycles')
        .select('id, start_date')
        .order('start_date', { ascending: false });

      if (error || !cycles || cycles.length === 0) {
        console.warn('[⚠️ Nenhum ciclo encontrado ou erro na busca]', error);
        return;
      }

      if (!selectedCycleId) {
        setSelectedCycleId(cycles[0].id);
      }
    };

    loadCycles();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      console.log('[🔁 selectedCycleId detectado no Dashboard]', selectedCycleId);
      fetchOKRs(selectedCycleId);
    }
  }, [selectedCycleId]);

  useEffect(() => {
    fetchAllOKRs();
  }, []);


  // 📊 Matriz do Placar: montar dados e datas
  const placarData = okrs
  .filter(okr => okr.cycle_id === selectedCycleId)
  .flatMap(okr =>
    (okr.keyResults ?? []).map(kr => {
      const checkinsMap = (kr.checkins ?? []).reduce((acc: Record<string, 'green' | 'yellow' | 'red' | null>, checkin) => {
        acc[checkin.date] = checkin.confidence_flag ?? null;
        return acc;
      }, {});

      return {
        kr_text: kr.text,
        okr_type: okr.type, // <-- vem do OKR pai!
        progress: kr.progress ?? 0,
        checkins: checkinsMap,
      };
    })
  );

  const allDates = [...new Set(
    keyResults
      .flatMap(kr => kr.checkins ?? [])
      .map(checkin => checkin.date)
  )].sort();

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
          period={
            selectedCycle.start_date_text && selectedCycle.end_date_text
              ? `${format(new Date(`${selectedCycle.start_date_text}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} até ${format(new Date(`${selectedCycle.end_date_text}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
              : 'Período inválido'
          }
          innerClassName="pb-6"
        />
      )}
  
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          {!selectedCycle && (
            <div className="w-full h-[70vh] flex justify-center items-center px-6 text-center">
              <div className="max-w-md">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
                  Nenhum ciclo encontrado
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                  Comece seu planejamento com a ajuda da Key. Crie um ciclo de OKRs e defina
                  os próximos passos com mais clareza e foco.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar Ciclo de OKR
                </button>
              </div>
            </div>

          )}
  
          {selectedCycle && (
            <div className="w-full md:w-auto ml-auto">
              <select
                className="border px-4 py-2 rounded-xl w-full md:w-auto"
                value={selectedCycleId ?? ''}
                onChange={(e) => setSelectedCycleId(e.target.value)}
              >
                <option value="" disabled>Selecione um ciclo</option>
                {cycles.map(cycle => (
                  <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                ))}
              </select>
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
            {placarData.length > 0 && allDates.length > 0 && (
              <div className="grid grid-cols-1">
                <MatrizPlacar data={placarData} dates={allDates} />
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

