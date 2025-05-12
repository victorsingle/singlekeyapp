import React, { useState, useEffect } from 'react';
import { useMemo } from 'react';
import RadarLoader from './RadarLoader';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, List, Network } from 'lucide-react';

// 2. Stores
import { useAuthStore } from '../stores/authStore';
import { useOKRStore } from '../stores/okrStore';

// 3. Services
import { createManualOKR } from '../services/okrService';

// 4. Components
import { SubHeader } from '../components/SubHeader';
import { OkrDetailsView } from '../components/okr/OkrDetailsView';
import { OKRRelationMap } from './OKRRelationMap';

// Btn Checlkin
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../stores/notificationStore'; 
import { CheckinButton } from '../components/CheckinButton';

//Onboarding
import { FeatureGuide } from '../components/onboarding/FeatureGuide';

import { usePermissions } from '../hooks/usePermissions'; 

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

  const { userId: storeUserId, organizationId } = useAuthStore();
  const [fallbackUserId, setFallbackUserId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!storeUserId) {
      console.warn('[⏳] Aguardando authStore.userId... tentando fallback via Supabase');
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          console.log('[✅] Fallback userId recuperado do Supabase:', data.user.id);
          setFallbackUserId(data.user.id);
        }
      });
    }
  }, [storeUserId]);
  
  const userId = storeUserId ?? fallbackUserId ?? '';

  const { notifications } = useNotificationStore();

  const SomeComponent = () => {
    return (
      <div className="flex items-center space-x-2">
        <RadarLoader />
      </div>
    );
  };
  
  const { isAdmin, isChampion } = usePermissions();



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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <RadarLoader />
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
  
  const checkinNotification = notifications.find(
    (n) =>
      n.type === 'checkin_reminder' &&
      !n.read &&
      n.data?.cycle_id === cycle.id
  );

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
      <FeatureGuide />
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
        badgeClassName={
          cycle.status === 'active'
            ? 'bg-yellow-100 text-yellow-800'
            : cycle.status === 'completed'
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-800'
        }
        subtitle={cycle.strategicTheme || undefined}
        period={
          cycle?.start_date && cycle?.end_date
            ? `${format(addDays(new Date(cycle.start_date), 1), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} até ${format(addDays(new Date(cycle.end_date), 1), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
            : 'Período inválido'
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-10">

      <div
        className={`flex justify-end items-center gap-2 mb-4 ${
          viewMode === 'graph'
            ? 'fixed top-20 right-5 z-[9999]'
            : ''
        }`}
      >

            <div
              data-guide="view-types"
              className={`inline-flex rounded-md overflow-hidden ${
                viewMode === 'graph' ? 'shadow-lg' : ''
              }`}
            >
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 m-0 border border-gray-200 bg-gray-50 text-blue-600 text-xs rounded-bl rounded-tl ${
                viewMode === 'list'
                  ? '!bg-blue-700 text-white'
                  : 'bg-gray-200 text-white-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('graph')}
              className={`px-4 py-2 m-0 border border-gray-200 bg-gray-50 text-blue-600 text-xs rounded-br rounded-tr ${
                viewMode === 'graph'
                  ? '!bg-blue-700 text-white'
                  : 'bg-gray-200 text-white-700'
              }`}
            >
              <Network className="w-4 h-4" />
            </button>
          </div>
        </div>



      {viewMode === 'list' && (
        <OkrDetailsView okrs={okrsDoCiclo} viewMode={viewMode} setViewMode={setViewMode} />
      )}

      {viewMode === 'graph' && (
        <div className="fixed inset-0 z-[30] w-screen h-screen bg-white">
          <ReactFlowProvider>
            <OKRRelationMap okrs={okrsDoCiclo} links={linksDoCiclo} />
          </ReactFlowProvider>
        </div>
      )}

        <div className="flex justify-center mt-10 mb-10">
          <button
            onClick={handleCreateOKR}
            disabled={isCreating}
            className={`px-4 py-2 rounded text-sm  transition ${
              isCreating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isCreating ? 'Criando...' : 'Criar Novo Objetivo'}
          </button>
          
          {(isAdmin || isChampion) && (
           <>
            {okrsDoCiclo.length > 0 && okrsDoCiclo.length > 0 && (
            <CheckinButton
              cycleId={cycle.id}
              userId={userId}
              checkinNotification={checkinNotification}
            />
            )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
