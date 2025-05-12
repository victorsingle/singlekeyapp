import { Target } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export function OnboardingStep1({ onNext }: Props) {
  return (
    <div className="w-full flex flex-col items-center space-y-3 text-center">
      <div className="bg-blue-50 rounded-full shadow-inner animate-pulse">
        <Target className="w-14 h-14 text-blue-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Oi, eu sou a <span className="text-blue-600">KAI</span></h1>
      <p className="text-sm text-gray-500 max-w-md">
        Sua copiloto estratégica. Vamos começar definindo os times da sua organização e entendendo o que precisa ser alcançado.
      </p>
      <div className="w-full flex justify-center">
        <img
          src="/image/onboarding/step1.svg"
          alt="Ilustração onboarding"
          className="w-[280px] sm:w-[320px] md:w-[350px] h-auto"
        />
      </div>
      <button
        onClick={onNext}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Vamos começar?
      </button>
    </div>
  );
}
