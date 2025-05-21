import { create } from 'zustand';

export type ChatPhase =
  | 'awaiting_context'
  | 'awaiting_confirmation'
  | 'awaiting_adjustment'
  | 'ready_to_generate'
  | 'finished';

interface EstruturaOKRs {
  ciclo: {
    nome: string;
    dataInicio: string;
    dataFim: string;
    temaEstratégico: string;
  };
  okrs: any[];
  links: any[];
}

interface KaiChatState {
  phase: ChatPhase;
  prompt: string; // entrada inicial
  confirmedPrompt: string; // resposta de confirmação da IA
  propostaGerada: string; // resposta em texto explicativo
  estruturaJson: EstruturaOKRs | null; // estrutura OKR em formato JSON
  setPrompt: (p: string) => void;
  setConfirmedPrompt: (p: string) => void;
  setPropostaGerada: (p: string) => void;
  setEstruturaJson: (data: EstruturaOKRs) => void;
  phaseTo: (p: ChatPhase) => void;
  reset: () => void;
}

export const useKaiChatStore = create<KaiChatState>((set) => ({
  phase: 'awaiting_context',
  prompt: '',
  confirmedPrompt: '',
  propostaGerada: '',
  estruturaJson: null,
  setPrompt: (p) => set({ prompt: p }),
  setConfirmedPrompt: (p) => set({ confirmedPrompt: p }),
  setPropostaGerada: (p) => set({ propostaGerada: p }),
  setEstruturaJson: (data) => set({ estruturaJson: data }),
  phaseTo: (p) => set({ phase: p }),
  reset: () =>
    set({
      phase: 'awaiting_context',
      prompt: '',
      confirmedPrompt: '',
      propostaGerada: '',
      estruturaJson: null,
    }),
}));
