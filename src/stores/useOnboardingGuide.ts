import { create } from 'zustand';

interface OnboardingGuideState {
  step: number;
  visible: boolean;
  startGuide: () => void;
  nextStep: () => void;
  skipGuide: () => void;
}

export const useOnboardingGuide = create<OnboardingGuideState>((set) => {
  const savedStep = Number(localStorage.getItem('onboarding-step') || '1');
  const savedVisible = localStorage.getItem('onboarding-visible') === 'true';

  return {
    step: savedStep,
    visible: savedVisible,
    startGuide: () => {
      localStorage.setItem('onboarding-step', '1');
      localStorage.setItem('onboarding-visible', 'true');
      set({ step: 1, visible: true });
    },
    nextStep: () => set((state) => {
      const next = state.step + 1;
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