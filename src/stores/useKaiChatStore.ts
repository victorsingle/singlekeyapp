import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ParsedOKRStructure } from '../types/okr';

interface KaiChatState {
  estruturaJson: ParsedOKRStructure | null;
  propostaConfirmada: boolean;
  setEstruturaJson: (json: ParsedOKRStructure) => void;
  setPropostaConfirmada: (valor: boolean) => void;
}

export const useKaiChatStore = create<KaiChatState>()(
  devtools((set) => ({
    estruturaJson: null,
    propostaConfirmada: false,

    setEstruturaJson: (json) => set({ estruturaJson: json }),
    setPropostaConfirmada: (valor) => set({ propostaConfirmada: valor }),
  }))
);

export const useKaiChatStore = create<KaiChatState>()(
  devtools((set) => ({
    estruturaJson: null,
    propostaConfirmada: false,

    setEstruturaJson: (json) => set({ estruturaJson: json }),
    setPropostaConfirmada: (valor) => set({ propostaConfirmada: valor }),

    resetKai: () => set({ estruturaJson: null, propostaConfirmada: false }),
  }))
);