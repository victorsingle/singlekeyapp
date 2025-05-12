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
    <div className="w-full flex flex-col items-center space-y-3 text-center">
      <div className="bg-blue-50 rounded-full shadow-inner animate-pulse">
        <Target className="w-14 h-14 text-blue-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Me diga o que precisamos alcançar</h1>
      <p className="text-sm text-gray-500 max-w-md">
        Use suas palavras. Quanto mais contexto, mais consigo te ajudar!
      </p>

      <div className="w-full max-w-xl space-y-1">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Queremos estruturar melhor nossas metas para o próximo quarter. O foco é aumentar a conversão no funil B2B, reduzir churn de clientes atuais e lançar uma nova frente de produtos digitais ainda este ano..."
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
