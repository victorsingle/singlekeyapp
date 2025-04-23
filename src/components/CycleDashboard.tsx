import React, { useState } from 'react';
import { CalendarRange, Sparkles, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useOKRStore } from '../stores/okrStore';
import { CycleForm } from './CycleForm';
import { OKRGenerator } from './OKRGenerator';
import { Modal } from './Modal';
import { SubHeader } from './SubHeader';
import clsx from 'clsx';

export function CycleDashboard() {
  const { cycles, fetchCycles, deleteCycle, error } = useOKRStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, cycleId: null });
  const navigate = useNavigate();

  const handleEdit = (cycle: any) => {
    setSelectedCycle(cycle);
    setIsFormOpen(true);
  };

  const handleDelete = (cycleId: string) => {
    setConfirmModal({ isOpen: true, cycleId });
  };

  const confirmDelete = async () => {
    if (confirmModal.cycleId) {
      await deleteCycle(confirmModal.cycleId);
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

  const handleFormSubmit = () => {
    handleFormClose();
    fetchCycles();
  };

  const handleFinishGeneration = (cycleId: string) => {
    navigate(`/cycle/${cycleId}`);
  };

  return (
    <>
    {cycles.length > 0 && (
      <SubHeader
        breadcrumb={[{ label: 'Ciclos' }]}
        title="Ciclos de OKRs"
        subtitle="Crie, visualize e acompanhe os períodos de planejamento."
        innerClassName="pb-8"
      />
    )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {cycles.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 mb-10">
            <h2 className="text-xl font-bold text-gray-900 hidden sm:block">
              Planejamentos Realizados
            </h2>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end">
              <button
                onClick={() => setIsGeneratorOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar com a Key
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
              >
                Criar Manualmente
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {cycles.length === 0 ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full">
              <OKRGenerator
                onFinish={handleFinishGeneration}
                onManualStart={() => setIsFormOpen(true)}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                className={clsx(
                  'bg-white rounded-xl shadow-sm border border-gray-100 p-6',
                  'border-l-[5px]',
                  {
                    'border-l-green-600': cycle.status === 'active',
                    'border-l-gray-300': cycle.status === 'completed',
                    'border-l-yellow-600': cycle.status === 'draft',
                  }
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {cycle.name}
                    </h2>
                    <p className="flex items-center text-[12px] md:text-xs text-gray-500 whitespace-nowrap">
                      <CalendarRange className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      {cycle.start_date_text && cycle.end_date_text ? (
                        <>
                          {format(new Date(`${cycle.start_date_text}T00:00:00`), "d 'de' MMM 'de' yy", { locale: ptBR })} até{' '}
                          {format(new Date(`${cycle.end_date_text}T00:00:00`), "d 'de' MMM 'de' yy", { locale: ptBR })}
                        </>
                      ) : (
                        'Período inválido'
                      )}
                    </p>
                    {cycle.strategic_theme && (
                      <p className="text-blue-600 font-medium mt-2">
                        {cycle.strategic_theme}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={clsx(
                        'px-3 py-1 rounded-full text-sm font-medium',
                        {
                          'bg-green-100 text-green-800': cycle.status === 'active',
                          'bg-gray-100 text-gray-800': cycle.status === 'completed',
                          'bg-yellow-100 text-yellow-800': cycle.status === 'draft',
                        }
                      )}
                    >
                      {cycle.status === 'active' ? 'Ativo' :
                        cycle.status === 'completed' ? 'Concluído' :
                        cycle.status === 'draft' ? 'Rascunho' : cycle.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end items-center space-x-3">
                  <button
                    onClick={() => navigate(`/cycle/${cycle.id}`)}
                    className="text-sm text-white px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Visualizar OKRs
                  </button>

                  <button
                    onClick={() => handleEdit(cycle)}
                    className="text-sm px-2 py-1 bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-colors"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(cycle.id)}
                    className="text-sm px-2 py-1 bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <CycleForm
                cycle={selectedCycle}
                onClose={handleFormClose}
                onSubmit={handleFormSubmit}
              />
            </div>
          </div>
        )}

        {isGeneratorOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-auto max-h-[90vh]">
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Continuo por aqui para te ajudar! :)</h2>
                <button onClick={() => setIsGeneratorOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <OKRGenerator
                  isModal={true}
                  onFinish={(cycleId) => {
                    setIsGeneratorOpen(false);
                    navigate(`/cycle/${cycleId}`);
                  }}
                  onManualStart={() => {
                    setIsGeneratorOpen(false);
                    setIsFormOpen(true);
                  }}
                />
              </div>
            </div>
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
      </div>
    </>
  );
}
