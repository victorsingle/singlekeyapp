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
  setPrompt: (p: string) => void;
  setConfirmedPrompt: (p: string) => void;
  phaseTo: (p: ChatPhase) => void;
  reset: () => void;
}

export const useKaiChatStore = create<KaiChatState>((set) => ({
  phase: 'awaiting_context',
  prompt: '',
  confirmedPrompt: '',
  setPrompt: (p) => set({ prompt: p }),
  setConfirmedPrompt: (p) => set({ confirmedPrompt: p }),
  phaseTo: (p) => set({ phase: p }),
  reset: () =>
    set({
      phase: 'awaiting_context',
      prompt: '',
      confirmedPrompt: '',
    }),
}));