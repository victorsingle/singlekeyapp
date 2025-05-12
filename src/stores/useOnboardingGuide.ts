import { create } from 'zustand';
import { steps } from '../constants/onboardingSteps';

interface OnboardingGuideState {
  step: number;
  visible: boolean;
  startGuide: () => void;
  nextStep: () => void;
  skipGuide: () => void;
}

export const useOnboardingGuide = create<OnboardingGuideState>((set) => ({
  step: 1,
  visible: false,
  startGuide: () => set({ visible: true, step: 1 }),
  nextStep: () => set((state) => {
    if (state.step >= steps.length) {
      return { visible: false, step: 0 };
    }
    return { step: state.step + 1 };
  }),
  skipGuide: () => set({ visible: false, step: 0 }),
}));
