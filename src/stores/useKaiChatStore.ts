import { create } from 'zustand';

export type ChatPhase =
  | 'awaiting_context'
  | 'awaiting_confirmation'
  | 'awaiting_adjustment'
  | 'ready_to_generate'
  | 'finished';

interface KaiChatState {
  phase: ChatPhase;
  prompt: string;
  setPrompt: (prompt: string) => void;
  phaseTo: (phase: ChatPhase) => void;
  reset: () => void;
}

export const useKaiChatStore = create<KaiChatState>((set) => ({
  phase: 'awaiting_context',
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),
  phaseTo: (phase) => set({ phase }),
  reset: () => set({ phase: 'awaiting_context', prompt: '' }),
}));
