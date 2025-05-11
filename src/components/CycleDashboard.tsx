import React, { useState, useEffect } from 'react';
import { CalendarRange, Sparkles, X } from 'lucide-react';
import RadarLoader from './RadarLoader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
//mudou
import { useCycleStore } from '../stores/okrCycleStore'; 
import { CycleCard } from "./CycleCard";

import { CycleForm } from './CycleForm';
import { OKRGenerator } from './OKRGenerator';
import { Modal } from './Modal';
import { SubHeader } from './SubHeader';
import { usePermissions } from '../hooks/usePermissions'; 
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

export function CycleDashboard() {
  
  //mudou
  const { cycles, loadCycles, deleteCycle, error, loadingCycles } = useCycleStore();

  const { loading, fetchUserData } = useAuthStore();
  const { canCreateCycle, canEditCycle, canDeleteCycle } = usePermissions(); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [shouldOpenForm, setShouldOpenForm] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const { isAdmin, isChampion } = usePermissions();

  const SomeComponent = () => {
    return (
      <div className="flex items-center space-x-2">
        <RadarLoader />
      </div>
    );
  };

  const formattedPeriod = (start: string, end: string) => {
    if (!start || !end) return 'Período inválido';
    const inicio = format(new Date(`${start}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    const fim = format(new Date(`${end}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    return `${inicio} até ${fim}`;
  };
  
  const handleManualStart = () => {
    console.log('handleManualStart chamado');
    setShouldOpenForm(true);
    setIsGeneratorOpen(false);
  };
  
  useEffect(() => {
    console.log('useEffect monitorando isGeneratorOpen e shouldOpenForm');
    if (!isGeneratorOpen && shouldOpenForm) {
      console.log('Condições atendidas para abrir o formulário');
      setShouldOpenForm(false);
      setIsFormOpen(true);
      setSelectedCycle(null);
    }
  }, [isGeneratorOpen, shouldOpenForm]);

  useEffect(() => {
    console.log('[🛠️] CycleDashboard montado, buscando dados do usuário...');
    fetchUserData();
  }, []);
  
  //mudou
  const { user, organizationId: sessionOrganizationId } = useAuthStore();

  useEffect(() => {
    if (!sessionOrganizationId) {
      console.log('[🟡] OrganizationId ainda não carregado. Aguardando...');
      return;
    }
  
    console.log('[🟢] OrganizationId carregado, buscando ciclos...', sessionOrganizationId);
    loadCycles(sessionOrganizationId);
  }, [sessionOrganizationId]);

  useEffect(() => {
    const closeListener = () => setIsGeneratorOpen(false);
    window.addEventListener('closeGenerator', closeListener);
    return () => window.removeEventListener('closeGenerator', closeListener);
  }, []);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, cycleId: null });
  const navigate = useNavigate();

  const handleEdit = (cycle: any) => {
    if (!canEditCycle) {
      return toast.error('Você não tem permissão para editar ciclos.');
    }
    setSelectedCycle(cycle);
    setIsFormOpen(true);
  };

  const handleDelete = (cycleId: string) => {
    if (!canDeleteCycle) {
      return toast.error('Você não tem permissão para excluir ciclos.');
    }
    setConfirmModal({ isOpen: true, cycleId });
  };

  const confirmDelete = async () => {
    if (confirmModal.cycleId) {
      try {
        await deleteCycle(confirmModal.cycleId);
        toast.success('Ciclo excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir ciclo.');
      }
      setConfirmModal({ isOpen: false, cycleId: null });
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ isOpen: false, cycleId: null });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedCycle(null);
  };

  const handleFormSubmit = async () => {
    handleFormClose();
    const { organizationId } = useAuthStore.getState();
    if (organizationId) {
      await loadCycles(organizationId);
    }
  };

  const handleFinishGeneration = (cycleId: string) => {
    navigate(`/cycle/${cycleId}`);
  };

  if (loading || loadingCycles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <RadarLoader />
      </div>
    );
  }

  return (
    <>
      {cycles && cycles.length > 0 && (
        <SubHeader
          breadcrumb={[{ label: 'Ciclos' }]}
          title="Ciclos de OKRs"
          subtitle="Crie, visualize e acompanhe os períodos de planejamento."
          innerClassName="pb-0"
        />
      )}
  
      <div className="max-w-7xl mx-auto pb-20 px-4 py-8 sm:px-6 lg:px-10">
        {cycles.length > 0 ? (
          <>
            {(isAdmin || isChampion) && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 mb-10">

    
                {canCreateCycle && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end">
                    <button
                      onClick={() => setIsGeneratorOpen(true)}
                      className="w-full sm:w-auto flex items-center text-sm justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Gerar com a KAI
                    </button>
                    <button
                      onClick={() => setIsFormOpen(true)}
                      className="w-full sm:w-auto flex items-center text-sm justify-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    >
                      Criar sem ajuda
                    </button>
                  </div>
                )}
              </div>
             )}
            <div className="grid gap-6">

            {cycles.map((cycle) => (
                <CycleCard
                  key={cycle.id}
                  id={cycle.id}
                  title={cycle.name}
                  status={cycle.status}
                  strategicTheme={cycle.strategicTheme}
                  period={formattedPeriod(cycle.startDateText, cycle.endDateText)}
                  onView={() => navigate(`/cycle/${cycle.id}`)}
                  onEdit={() => handleEdit(cycle)}
                  onDelete={() => handleDelete(cycle.id)}
                  canEdit={canEditCycle}
                  canDelete={canDeleteCycle}
                  isFormOpen={isFormOpen}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full">
              <OKRGenerator
                onFinish={handleFinishGeneration}
                onManualStart={handleManualStart}
              />
            </div>
          </div>
        )}
  
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>
      
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CycleForm
              cycle={selectedCycle}
              onClose={handleFormClose}
              onSubmit={handleFormSubmit}
            />
          </div>
        </div>
      )}
  
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-20 overflow-auto">
          <div className="absolute inset-0 bg-black bg-opacity-40 z-[-1]" />
          
          <OKRGenerator
              isModal={false}
              fromList={true}
              onFinish={handleFinishGeneration}
              onManualStart={handleManualStart}
            />
        </div>
      )}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={cancelDelete}
        title="Confirmar Exclusão"
        type="warning"
        actions={
          <>
            <button
              onClick={cancelDelete}
              className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </button>
          </>
        }
      >
        Tem certeza que deseja excluir este ciclo? Todos os OKRs relacionados serão removidos permanentemente.
      </Modal>
    </>
  );
}
