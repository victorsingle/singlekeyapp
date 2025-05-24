import { create } from 'zustand';
import { steps } from '../constants/onboardingSteps';

interface OnboardingGuideState {
  step: number;
  visible: boolean;
  startGuide: () => void;
  nextStep: () => void;
  skipGuide: () => void;
}

export const useOnboardingGuide = create<OnboardingGuideState>((set, get) => ({
  step: 0,
  visible: false,

  startGuide: () => {
    set({ step: 1, visible: true });
  },

  nextStep: () => {
    const next = get().step + 1;
    const totalSteps = steps.length; // ← usa direto a fonte
    if (next > totalSteps) {
      set({ step: 0, visible: false });
    } else {
      set({ step: next });
    }
  },

  skipGuide: () => {
    set({ step: 0, visible: false });
  },
}));
