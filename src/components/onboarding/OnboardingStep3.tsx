import React from 'react';
import { Target } from 'lucide-react';
import { useOKRStore } from '../stores/okrStore';
import { GenerateOKRButton } from '../../components/GenerateOKRButton';

interface Props {
  onBack: () => void;
  onFinish: () => Promise<void>;
  prompt: string;
  setPrompt: (value: string) => void;
}   

export function OnboardingStep3({ onBack, onFinish, prompt, setPrompt }: Props) {
  const minChars = 250;

  return (
    <div className="w-full flex flex-col items-center space-y-6 text-center">
      <div className="bg-blue-50 p-2 rounded-full shadow-inner animate-pulse">
        <Target className="w-10 h-10 text-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Me diga o que vocês querem alcançar</h2>
      <p className="text-sm text-gray-500 max-w-md">
        Pode escrever do seu jeito. Quanto mais claro for, melhor eu consigo te ajudar.
      </p>

      <div className="w-full max-w-xl space-y-1">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Queremos aumentar a receita no B2B, melhorar aquisição de clientes e reduzir o tempo de conversão em 20%."
          className="w-full text-sm p-4 h-40 rounded-xl border border-gray-300 shadow-sm resize-none"
        />
        <div className="text-right text-xs text-gray-500">
          {prompt.length} / {minChars} caracteres
          {prompt.length < minChars && (
            <span className="text-red-500 ml-2">Mínimo de 250</span>
          )}
        </div>
      </div>

      <div className="w-full max-w-xl flex justify-between items-center pt-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-blue-600 transition"
        >
          ← Voltar
        </button>

        <GenerateOKRButton
          disabled={prompt.length < minChars}
          onGenerate={onFinish}
        />
      </div>
    </div>
  );
}
