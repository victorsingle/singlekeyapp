import { create } from 'zustand';

export type ChatPhase =
  | 'awaiting_context'
  | 'awaiting_confirmation'
  | 'awaiting_adjustment'
  | 'ready_to_generate'
  | 'finished';

interface KaiChatState {
  phase: ChatPhase;
  prompt: string; // entrada inicial
  confirmedPrompt: string; // estrutura aprovada
  propostaGerada: string; // estrutura da proposta em texto
  setPrompt: (p: string) => void;
  setConfirmedPrompt: (p: string) => void;
  setPropostaGerada: (p: string) => void;
  phaseTo: (p: ChatPhase) => void;
  reset: () => void;
}

export const useKaiChatStore = create<KaiChatState>((set) => ({
  phase: 'awaiting_context',
  prompt: '',
  confirmedPrompt: '',
  propostaGerada: '',
  setPrompt: (p) => set({ prompt: p }),
  setConfirmedPrompt: (p) => set({ confirmedPrompt: p }),
  setPropostaGerada: (p) => set({ propostaGerada: p }),
  phaseTo: (p) => set({ phase: p }),
  reset: () =>
    set({
      phase: 'awaiting_context',
      prompt: '',
      confirmedPrompt: '',
      propostaGerada: '',
    }),
}));
