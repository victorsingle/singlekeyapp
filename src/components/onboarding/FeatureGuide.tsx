import { useEffect, useRef, useState } from 'react';
import { useOnboardingGuide } from '../../stores/useOnboardingGuide';
import { steps } from '../../constants/onboardingSteps';

export function FeatureGuide() {
  const { step, visible, nextStep, skipGuide } = useOnboardingGuide();

  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const current = steps.find((s) => s.step === step);
  const isLastStep = step >= steps.length;

  useEffect(() => {
    if (!visible || !current) return;

    const target = document.querySelector(`[data-guide="${current.target}"]`) as HTMLElement;
    const tooltip = tooltipRef.current;
    if (!target || !tooltip) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const timeout = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      const ttWidth = tooltip.offsetWidth;
      const ttHeight = tooltip.offsetHeight;

      let top = 0;
      let left = 0;

      switch (current.placement) {
        case 'top':
          top = rect.top + scrollTop - ttHeight - 8;
          left = rect.left + scrollLeft + rect.width / 2 - ttWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + scrollTop + 8;
          left = rect.left + scrollLeft + rect.width / 2 - ttWidth / 2;
          break;
        case 'left':
          top = rect.top + scrollTop + rect.height / 2 - ttHeight / 2;
          left = rect.left + scrollLeft - ttWidth - 8;
          break;
        case 'right':
        default:
          top = rect.top + scrollTop + rect.height / 2 - ttHeight / 2;
          left = rect.right + scrollLeft + 8;
          break;
      }

      setPosition({ top, left });
    }, 0);

    return () => clearTimeout(timeout);
  }, [step, current, visible]);

  const handleNext = () => {
    if (isLastStep) {
      skipGuide();
    } else {
      nextStep();
    }
  };

  const arrowClass = current && {
    top: 'absolute bottom-[-8px] left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-t-8 border-t-purple-600',
    bottom: 'absolute top-[-8px] left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-b-8 border-b-purple-600',
    left: 'absolute right-[-8px] top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-l-8 border-l-purple-600',
    right: 'absolute left-[-8px] top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-r-8 border-r-purple-600',
  }[current?.placement];

  // ⛳ Aqui sim: só oculta o conteúdo, mas mantém os hooks ativos
  if (!visible || !current) return <></>;

  return (
    <div
      ref={tooltipRef}
      className="z-50 absolute bg-purple-600 text-white p-4 rounded-lg shadow-lg max-w-[90vw] sm:w-64 transition-all"
      style={{ top: position.top, left: position.left }}
    >
      <div className={arrowClass} />
      <h3 className="font-bold mb-1">{current.title}</h3>
      <p className="text-sm mb-3">{current.description}</p>
      <div className="flex gap-4">
        <button onClick={handleNext} className="bg-white text-purple-600 px-3 py-1 rounded">
          {isLastStep ? 'Finalizar' : 'Próximo'}
        </button>
        <button onClick={skipGuide} className="text-white underline text-sm">Pular</button>
      </div>
    </div>
  );
}
