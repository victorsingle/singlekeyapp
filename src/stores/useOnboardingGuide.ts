import { create } from 'zustand';
import { steps } from '../constants/onboardingSteps';

interface OnboardingGuideState {
  step: number;
  visible: boolean;
  startGuide: () => void;
  nextStep: () => void;
  skipGuide: () => void;
}

export const useOnboardingGuide = create<OnboardingGuideState>((set) => {
  let savedStep = Number(localStorage.getItem('onboarding-step'));
  const savedVisible = localStorage.getItem('onboarding-visible') === 'true';

  // Se não existe step salvo, considere visibilidade falsa
  if (!savedStep || isNaN(savedStep)) {
    savedStep = 0;
  }

  return {
    step: savedVisible ? savedStep : 0,
    visible: savedVisible,
    startGuide: () => {
      localStorage.setItem('onboarding-step', '1');
      localStorage.setItem('onboarding-visible', 'true');
      set({ step: 1, visible: true });
    },
    nextStep: () => set((state) => {
      const next = state.step + 1;

      if (next > steps.length) {
        localStorage.removeItem('onboarding-step');
        localStorage.removeItem('onboarding-visible');
        return { step: 0, visible: false };
      }

      localStorage.setItem('onboarding-step', String(next));
      return { step: next };
    }),
    skipGuide: () => {
      localStorage.removeItem('onboarding-step');
      localStorage.removeItem('onboarding-visible');
      set({ step: 0, visible: false });
    },
  };
});
