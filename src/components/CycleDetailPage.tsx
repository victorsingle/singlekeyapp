import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { ArrowLeft, List, Network } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { groupOKRsByHierarchy } from '../lib/okr/groupOKRsByHierarchy';
import { getUnlinkedOKRs } from '../lib/okr/getUnlinkedOKRs';
import { OKRListTable } from '../components/OKRListTable';
import { useOKRStore } from '../stores/okrStore';
import { OKRRelationMap } from './OKRRelationMap';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { SubHeader } from '../components/SubHeader';

interface CycleDetailPageProps {
  cycleId: string;
}

export function CycleDetailPage({ cycleId }: CycleDetailPageProps) {
  const { updateOKR, updateKeyResult, deleteOKR, deleteKeyResult, setSelectedCycleId } = useOKRStore();
  const cycles = useOKRStore((s) => s.cycles);
  const loading = useOKRStore((s) => s.loading);
  const allOKRs = useOKRStore((s) => s.okrs);
  const allLinks = useOKRStore((s) => s.links);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const navigate = useNavigate();
  const selectedCycleId = useOKRStore((s) => s.selectedCycleId);
  const selectedCycle = cycles.find((c) => c.id === selectedCycleId);
  const isReadOnly = selectedCycle?.status === 'completed';
  const { createManualOKR } = useOKRStore();

  const currentCycle = cycles.find((c) => c.id === cycleId);
  const breadcrumbItems = [
    { label: 'Ciclos', href: '/cycles' },
    currentCycle ? { label: currentCycle.name } : { label: '...' },
  ];
  
 useEffect(() => {
  if (!cycleId) return;

  setSelectedCycleId(cycleId);

  const loadOKRsAndLinks = async () => {
    await useOKRStore.getState().fetchOKRs(cycleId);
    await useOKRStore.getState().fetchLinks();
  };

  loadOKRsAndLinks();
}, [cycleId, setSelectedCycleId]);



  if (loading || !cycles.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando ciclo...
      </div>
    );
  }

  const cycle = cycles.find((c) => String(c.id) === String(cycleId));
  if (!cycle) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Ciclo não encontrado.
      </div>
    );
  }

  const okrsDoCiclo = allOKRs.filter((okr) => okr.cycle_id === cycleId);
  const linksDoCiclo = allLinks.filter((link) => {
    const source = allOKRs.find(o => o.id === link.source_okr_id);
    return source?.cycle_id === cycleId;
  });

  // 🔧 Agrupamento e desvinculados
  const grouped = Array.isArray(okrsDoCiclo) && Array.isArray(linksDoCiclo)
    ? groupOKRsByHierarchy(okrsDoCiclo, linksDoCiclo)
    : [];

  const usedIds = new Set<string>();
  grouped.forEach(group => {
    usedIds.add(group.strategic.id);
    group.children.forEach(t => {
      usedIds.add(t.tactical.id);
      t.children.forEach(op => usedIds.add(op.id));
    });
  });

  const unlinked = getUnlinkedOKRs(okrsDoCiclo, usedIds);

  const handleUpdateOKR = async (okrId: string, updates: Partial<OKR>) => {
    await updateOKR(okrId, updates);
  };

  const handleUpdateKeyResult = async (krId: string, updates: Partial<OKR['keyResults'][0]>) => {
    await updateKeyResult(krId, updates);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SubHeader
        breadcrumb={breadcrumbItems}
        title={cycle.name}
        badge={
          cycle.status === 'active'
            ? 'Ativo'
            : cycle.status === 'completed'
            ? 'Concluído'
            : 'Rascunho'
        }
        subtitle={cycle.strategic_theme || undefined}
        period={
          cycle.start_date_text && cycle.end_date_text
            ? `${format(new Date(`${cycle.start_date_text}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} até ${format(new Date(`${cycle.end_date_text}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
            : 'Período inválido'
        }
        actions={
          <div className="fixed z-50 flex gap-2 md:top-[130px] right-4 md:right-[calc((100vw-88rem)/2)]">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-full shadow-md transition ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
  
            <button
              onClick={() => setViewMode('graph')}
              className={`p-3 rounded-full shadow-md transition ${
                viewMode === 'graph' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'
              }`}
            >
              <Network className="w-5 h-5" />
            </button>
          </div>
        }
      />
  
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {viewMode === 'list' && (
          <OKRListTable
            grouped={grouped ?? []}
            unlinked={unlinked ?? []}
            onUpdateOKR={handleUpdateOKR}
            onUpdateKeyResult={handleUpdateKeyResult}
            onDeleteOKR={deleteOKR}
            onDeleteKeyResult={deleteKeyResult}
            readOnly={isReadOnly}
          />
        )}
  
        {viewMode === 'graph' && (
          <div className="fixed inset-0 z-[10] w-screen h-screen bg-white">
            <ReactFlowProvider>
              <OKRRelationMap okrs={okrsDoCiclo} links={linksDoCiclo} />
            </ReactFlowProvider>
          </div>
        )}
  
        <div className="flex justify-center mt-10">
          <button
            onClick={() => selectedCycleId && createManualOKR(selectedCycleId)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Criar Novo Objetivo
          </button>
        </div>
      </main>
    </div>
  );

}