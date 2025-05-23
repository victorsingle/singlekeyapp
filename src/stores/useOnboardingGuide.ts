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
    localStorage.setItem('onboarding-step', '1');
    localStorage.setItem('onboarding-visible', 'true');
    set({ step: 1, visible: true });
  },

  nextStep: () => {
    const next = get().step + 1;
    const totalSteps = 7; // ajuste conforme seu array real de steps
    if (next > totalSteps) {
      localStorage.removeItem('onboarding-step');
      localStorage.removeItem('onboarding-visible');
      return set({ step: 0, visible: false });
    }
    localStorage.setItem('onboarding-step', String(next));
    set({ step: next });
  },

  skipGuide: () => {
    localStorage.removeItem('onboarding-step');
    localStorage.removeItem('onboarding-visible');
    set({ step: 0, visible: false });
  },
}));

