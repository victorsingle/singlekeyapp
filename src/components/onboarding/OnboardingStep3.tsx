import React from 'react';
import { Target } from 'lucide-react';
import { useOKRStore } from '../stores/okrStore';
import { OKRPreGenerator } from '../../pages/components/OKRPreGenerator';

interface Props {
  onBack: () => void;
  onFinish: () => Promise<void>;
  prompt: string;
  setPrompt: (value: string) => void;
}   

export function OnboardingStep3({ onBack, onFinish, prompt, setPrompt }: Props) {
  const minChars = 250;

  return (
    <div className="w-full flex flex-col items-center space-y-3 text-center">
      <div className="w-full max-w-xl space-y-2 mt-2 text-left">
       <OKRPreGenerator />
      </div>
    </div>
  );
}
