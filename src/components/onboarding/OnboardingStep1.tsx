import { Target } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export function OnboardingStep1({ onNext }: Props) {
  return (
    <div className="w-full flex flex-col items-center space-y-6 text-center">
      <div className="bg-blue-50 p-2 rounded-full shadow-inner animate-pulse">
        <Target className="w-10 h-10 text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Oi, eu sou a <span className="text-blue-600">KAI</span></h1>
      <p className="text-sm text-gray-500 max-w-md">
        Sua copiloto estratégica. Vamos começar definindo os times da sua organização e entender o que precisamos alcançar.
      </p>
      <button
        onClick={onNext}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
      >
        Vamos começar?
      </button>
    </div>
  );
}
