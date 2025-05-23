import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ParsedOKRStructure } from '../types/okr';

interface TeamInput {
  name: string;
  description?: string;
  organization_id: string;
}

interface KaiChatState {
  estruturaJson: ParsedOKRStructure | null;
  propostaConfirmada: boolean;
  teamsToCreate: TeamInput[];
  setEstruturaJson: (json: ParsedOKRStructure) => void;
  setPropostaConfirmada: (valor: boolean) => void;
  setTeamsToCreate: (teams: TeamInput[]) => void;
  resetKai: () => void;
}

export const useKaiChatStore = create<KaiChatState>()(
  devtools((set) => ({
    estruturaJson: null,
    propostaConfirmada: false,
    teamsToCreate: [],

    setEstruturaJson: (json) => set({ estruturaJson: json }),
    setPropostaConfirmada: (valor) => set({ propostaConfirmada: valor }),
    setTeamsToCreate: (teams) => set({ teamsToCreate: teams }),
    resetKai: () => set({ estruturaJson: null, propostaConfirmada: false, teamsToCreate: [] }),
  }))
);
