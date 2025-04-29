import React, { useState, useEffect } from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { List, Network } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// 2. Stores
import { useAuthStore } from '../stores/authStore';
import { useOKRStore } from '../stores/okrStore';

// 3. Services
import { createManualOKR } from '../services/okrService';

// 4. Components
import { SubHeader } from '../components/SubHeader';
import { OkrDetailsView } from '../components/okr/OkrDetailsView';
import { OKRRelationMap } from './OKRRelationMap';



interface CycleDetailPageProps {
  cycleId: string;
}

export function CycleDetailPage({ cycleId }: CycleDetailPageProps) {
  const {
    setSelectedCycleId,
    updateOKR,
    updateKeyResult,
    deleteOKR,
    deleteKeyResult,
    fetchLinks,
    createLink,
    deleteLink,
    selectedCycleId,
    cycles = [],
    loading,
    okrs: allOKRs,
    links: allLinks,
  } = useOKRStore();

  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [isCreating, setIsCreating] = useState(false); // <- controle de loading do botão

  const organizationId = useAuthStore((s) => s.organizationId);

  useEffect(() => {
    if (!organizationId || !cycleId) return;

    setSelectedCycleId(cycleId);

    const loadEverything = async () => {
      console.log('[🛠️] Disparando loadEverything');
    
      await useOKRStore.getState().loadCycles(organizationId);
      await useOKRStore.getState().loadOKRs(organizationId, cycleId);
    
      const okrs = useOKRStore.getState().okrs.filter(o => o.cycle_id === cycleId);
    
      await Promise.all(
        okrs.map((okr) => useOKRStore.getState().loadKeyResults(okr.id))
      );
    
      await useOKRStore.getState().fetchLinks(organizationId);
    };

    loadEverything();
  }, [organizationId, cycleId]);

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId);
  const isReadOnly = selectedCycle?.status === 'completed';

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
    const source = allOKRs.find((o) => o.id === link.source_okr_id);
    return source?.cycle_id === cycleId;
  });


  //Handlers Ações

  const handleCreateOKR = async () => {
    if (!selectedCycleId) return;
    try {
      setIsCreating(true);
      const newOKR = await createManualOKR(selectedCycleId);
      if (newOKR) {
        useOKRStore.getState().addOKR(newOKR); 
      }
    } catch (error) {
      console.error('Erro ao criar OKR:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SubHeader
        breadcrumb={[
          { label: 'Ciclos', href: '/cycles' },
          cycle ? { label: cycle.name } : { label: '...' },
        ]}
        title={cycle.name}
        badge={
          cycle.status === 'active'
            ? 'Ativo'
            : cycle.status === 'completed'
            ? 'Concluído'
            : 'Rascunho'
        }
        subtitle={cycle.strategicTheme || undefined}
        period={
          cycle?.start_date && cycle?.end_date
            ? `${format(new Date(cycle.start_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} até ${format(new Date(cycle.end_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
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
        <OkrDetailsView okrs={okrsDoCiclo} />
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
            onClick={handleCreateOKR}
            disabled={isCreating}
            className={`px-4 py-2 rounded transition ${
              isCreating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isCreating ? 'Criando...' : 'Criar Novo Objetivo'}
          </button>
        </div>
      </main>
    </div>
  );
}
