import React from 'react';
import { Target } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { OKRPreGenerator } from '../pages/components/OKRPreGenerator';
import { useCycleStore } from '../stores/okrCycleStore';

interface OKRGeneratorProps {
  onFinish: (cycleId: string) => void;
  onManualStart: () => void;
  isModal?: boolean;
  fromList?: boolean;
}

export function OKRGenerator({ onFinish, onManualStart, isModal = false }: OKRGeneratorProps) {
  const { isAdmin, isChampion } = usePermissions();

  if (!isAdmin && !isChampion) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-white to-indigo-200 flex flex-col items-center justify-center px-6 py-12 z-1 text-center">
        <div className="relative max-w-2xl w-full space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Ainda não há <span className="text-blue-600">ciclos de OKRs</span> disponíveis.
            </h1>
            <p className="text-sm text-gray-500">
              Fique tranquilo, seu Champion está preparando o próximo ciclo. Assim que estiver pronto, você poderá acompanhar os objetivos e contribuir com clareza e foco.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return isModal ? (
    <div className="p-4">
      <OKRPreGenerator onFinish={onFinish} fromOnboarding />
    </div>
  ) : (
    <div className="fixed inset-0 bg-gradient-to-br from-white to-indigo-200 flex flex-col items-center justify-center px-6 py-12 z-1 text-center">
      <div className="relative max-w-2xl w-full space-y-10 text-left">
        
        <OKRPreGenerator onFinish={onFinish} fromOnboarding />

        <div className="absolute right-6 bottom-0">
          {cycles.length > 0 && (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('closeGenerator'));
              }}
              className="text-xs text-gray-500 hover:text-blue-600 transition"
            >
              Voltar →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
