import React from 'react';
import { Modal } from './Modal';
import { useModalStore } from '../stores/modalStore';
import { useOKRStore } from '../stores/okrStore'; // ✅ importar store

export function ModalContainer() {
  const { isOpen, type, title, message, onConfirm, closeModal } = useModalStore();
  const { selectedCycle } = useOKRStore(); // ✅ extrair ciclo atual

  const actions = onConfirm ? (
    <>
      <button
        type="button"
        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
        onClick={() => {
          onConfirm();
          closeModal();
        }}
      >
        Confirmar
      </button>
      <button
        type="button"
        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
        onClick={closeModal}
      >
        Cancelar
      </button>
    </>
  ) : (
    <button
      type="button"
      className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
      onClick={closeModal}
    >
      Fechar
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={title}
      type={type}
      actions={actions}
    >
      {message}
    </Modal>
  );
}
