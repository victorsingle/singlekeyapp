import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  onConfirm?: () => void;
  showModal: (params: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }) => void;
  confirm: (title: string, message: string, onConfirm: () => void) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  onConfirm: undefined,
  showModal: ({ type, title, message, onConfirm }) =>
    set({ isOpen: true, type, title, message, onConfirm }),
  confirm: (title, message, onConfirm) =>
    set({ isOpen: true, type: 'warning', title, message, onConfirm }),
  closeModal: () => set({ isOpen: false, onConfirm: undefined }),
}));