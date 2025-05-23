import React from 'react';
import { Target } from 'lucide-react';
import { useOKRStore } from '../stores/okrStore';
import { OKRPreGenerator } from './components/OKRPreGenerator';

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
      <div className="bg-blue-50 rounded-full shadow-inner animate-pulse">
        <Target className="w-14 h-14 text-blue-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Me diga o que precisamos alcançar</h1>
      <p className="text-sm text-gray-500 max-w-md pb-4">
        Use suas palavras. Quanto mais contexto, mais consigo te ajudar!
      </p>

      <div className="w-full max-w-xl space-y-2 mt-2">
       <OKRPreGenerator />
      </div>
    </div>
  );
}
