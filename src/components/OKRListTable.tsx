import React from 'react';
import clsx from 'clsx';
import { OKRRow } from './OKRRow';
import { Modal } from './Modal';
import { useModalStore } from '../stores/modalStore';
import { useOKRStore } from '../stores/okrStore';

interface OKR {
  id: string;
  objective: string;
  type: 'strategic' | 'tactical' | 'operational';
  status: string;
  keyResults?: any[];
}

interface GroupedOKR {
  strategic: OKR;
  children: {
    tactical: OKR;
    children: OKR[];
  }[];
}

interface OKRListTableProps {
  grouped?: GroupedOKR[];
  unlinked?: OKR[];
  readOnly?: boolean;
}

export function OKRListTable({ grouped = [], unlinked = [], readOnly = false }: OKRListTableProps) {
  const { deleteOKR } = useOKRStore();
  const { confirmModal, setConfirmModal } = useModalStore();

  const handleConfirmDelete = async () => {
    if (confirmModal.targetId && confirmModal.targetType === 'okr') {
      await deleteOKR(confirmModal.targetId);
    }
    setConfirmModal({ isOpen: false, targetId: null, targetType: null, parentOkrId: null });
  };

  return (
    <>
      <div className={clsx("bg-white shadow-md rounded-xl", readOnly && "opacity-50 pointer-events-none")}>
        {/* DESKTOP */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <tbody className="bg-white divide-y divide-gray-200">
              {grouped.length > 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-sm text-gray-500 bg-gray-200">
                    <h2 className="p-3 text-lg text-blue-600 font-bold">OKRs com vínculos entre objetivos</h2>
                  </td>
                </tr>
              )}

              {grouped.map(({ strategic, children }) => (
                <React.Fragment key={strategic.id}>
                  <OKRRow okr={strategic} prefix="★" readOnly={readOnly} />

                  {children.map(({ tactical, children: ops }) => (
                    <React.Fragment key={tactical.id}>
                      <OKRRow okr={tactical} prefix="↳" readOnly={readOnly} />
                      {ops.map(op => (
                        <OKRRow key={op.id} okr={op} prefix="↳↳" readOnly={readOnly} />
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}

              {unlinked.length > 0 && (
                <>
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-sm text-gray-500 bg-gray-200">
                      <h2 className="p-3 text-lg text-blue-600 font-bold">OKRs sem vínculos entre objetivos</h2>
                    </td>
                  </tr>
                  {unlinked.map(okr => (
                    <OKRRow key={okr.id} okr={okr} readOnly={readOnly} />
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, targetId: null, targetType: null, parentOkrId: null })}
        title="Confirmar Exclusão"
        type="warning"
        actions={(
          <>
            <button
              onClick={() => setConfirmModal({ isOpen: false, targetId: null, targetType: null, parentOkrId: null })}
              className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </button>
          </>
        )}
      >
        Tem certeza que deseja excluir este objetivo?
      </Modal>
    </>
  );
}
