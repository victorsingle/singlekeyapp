import { create } from 'zustand';

interface ConfirmModalState {
  isOpen: boolean;
  targetId: string | null;
  targetType: 'okr' | 'kr' | null;
  parentOkrId: string | null;
}

interface ModalState {
  isOpen: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmModal: ConfirmModalState;
  showModal: (params: { type: 'info' | 'success' | 'warning' | 'error'; title: string; message: string; onConfirm?: () => void }) => void;
  confirm: (title: string, message: string, onConfirm: () => void) => void;
  closeModal: () => void;
  setConfirmModal: (modal: ConfirmModalState) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  onConfirm: undefined,
  confirmModal: {
    isOpen: false,
    targetId: null,
    targetType: null,
    parentOkrId: null,
  },
  showModal: ({ type, title, message, onConfirm }) =>
    set({ isOpen: true, type, title, message, onConfirm }),
  confirm: (title, message, onConfirm) =>
    set({ isOpen: true, type: 'warning', title, message, onConfirm }),
  closeModal: () => set({ isOpen: false, onConfirm: undefined }),
  setConfirmModal: (modal) => set({ confirmModal: modal }),
}));
