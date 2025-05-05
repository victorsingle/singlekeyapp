import React, { useState } from 'react';
import { Sparkles, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { useOKRStore } from '../stores/okrStore';
import { usePermissions } from '../hooks/usePermissions';
import { GenerateOKRButton } from './GenerateOKRButton';
import { trackTokenUsage } from '../lib/trackTokenUsage';
import { useTokenUsage } from '../hooks/useTokenUsage';


interface OKRGeneratorProps {
  onFinish: (cycleId: string) => void;
  onManualStart: () => void;
  isModal?: boolean;
  fromList?: boolean;
}

export function OKRGenerator({ onFinish, onManualStart, isModal = false, fromList = false }: OKRGeneratorProps) {
  const [context, setContext] = useState('');
  const minChars = 350;
  const { generateFullOKRStructure } = useOKRStore();
  const { isAdmin, isChampion } = usePermissions();


  const { usado, limite, percentual, refetch, isLoading } = useTokenUsage();
  const limiteAtingido = limite > 0 && usado >= limite;


  // 💡 Controla animação do ícone com base em estado
  const avatarAnimation = context.length === 0 ? 'animate-bounce' : '';

  return isModal ? (
    <section className="w-full max-w-2xl mx-auto bg-white m-5 mt-0">
      <div className="p-2 mb-1 -mt-2">
      <div className="flex items-center justify-left gap-3 mb-0">
        <div className={`${avatarAnimation} bg-blue-50 p-1 rounded-full shadow-inner`}>
          <Target className="w-7 h-7 text-blue-600" />
        </div>
        <p className="text-gray-600 text-md leading-relaxed -mt-3">
          Me conta o que mudou ou quais são os desafios para esse novo ciclo.
        </p>
      </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full h-[200px] p-3 border border-gray-300 rounded text-sm resize-none mb-0"
          placeholder={`Exemplo: Queremos expandir nossa atuação no mercado B2B, focando em empresas de médio porte em crescimento. Buscamos aumentar em 30% a receita nos próximos 3 meses, melhorar a aquisição de clientes, reforçar nossa presença digital e ampliar o time de vendas sem comprometer a qualidade do atendimento.`}
        />
        <div className="flex justify-between text-xs text-gray-500 !mt-[0px]">
          <span>{context.length} / {minChars} caracteres</span>
          {context.length < minChars && (
            <span className="text-red-500">Mínimo de 350 caracteres para gerar</span>
          )}
        </div>
        <button
          type="submit"
          disabled={context.length < minChars || loading}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded text-white font-medium',
            'bg-blue-600 hover:bg-blue-700 transition',
            (loading || context.length < minChars) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {loading ? 'Gerando...' : (
            <>
              <Sparkles className="w-4 h-4" />
              Gerar Mais Um Ciclo
            </>
          )}
        </button>
      </form>
    </section>
  ) : (
    <div className="fixed inset-0 bg-gradient-to-b from-white via-[#f5f8ff] to-[#e7effc] flex flex-col items-center justify-center px-6 py-12 z-1 text-center">
    <div className="relative max-w-2xl w-full space-y-10">
      
      {(isAdmin || isChampion) ? (

      <>
        {/* TÍTULO */}
        <div className="space-y-2">
        <span className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full animate-pulse">
          <Target className="w-16 h-16 text-blue-600" />
        </span>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Eu sou a <span className="text-blue-600">KAI</span>, sua copiloto de OKRs
          </h1>
          <p className="text-sm text-gray-500">
            Me diga qual é o desafio do próximo ciclo e eu cuido do resto.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="relative">
                {limiteAtingido && (
                  <p className="p-4 bg-red-100 text-red-800 text-sm rounded -mt-4 mb-2">
                    Limite de uso da IA atingido neste mês. Aguarde renovação!
                  </p>
                )}
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ex: Precisamos expandir nossa atuação no mercado B2B focando em empresas de médio porte. A meta é aumentar 30% da receita nos próximos 3 meses, melhorar a aquisição de clientes, reforçar nossa presença digital, ampliar o time de vendas e reduzir o ciclo de conversão em 20% sem perder qualidade...."
                className="w-full text-xs h-36 text-sm p-4 rounded-xl bg-white resize-none shadow-[0_20px_50px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                {context.length} / 350
                {context.length < 350 && (
                  <span className="text-red-500 ml-2">Mínimo de 350</span>
                )}
              </div>
            </div>

            {/* Botão principal */}
            <div className="w-full flex md:justify-center justify-start pt-2">
            <GenerateOKRButton
              disabled={context.length < minChars || limiteAtingido}
              onGenerate={async () => {
                const cycleId = await generateFullOKRStructure(context);
                toast.success('OKRs gerados com sucesso!');
                refetch(); // força atualização do uso
                setContext('');
                onFinish(cycleId);
              }}
            />
            </div>
          

          {/* Botão SECUNDÁRIO FORA do form */}
          <div className="absolute right-2 bottom-2">
            <button
              type="button"
              onClick={() => {
                if (fromList) {
                  window.dispatchEvent(new CustomEvent('closeGenerator'));
                } else {
                  onManualStart();
                }
              }}
              className="text-xs text-gray-500 hover:text-blue-600 transition"
            >
              {fromList ? 'Voltar' : 'Criar Manualmente'} →
            </button>
          </div>
          </form>
          </>
          ):(
            <>
            {/* TÍTULO */}
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                Ainda não há <span className="text-blue-600">ciclos de OKRs</span> disponíveis.
                </h1>
                <p className="text-sm text-gray-500">
                Fique tranquilo, seu Champion está preparando o próximo ciclo. Assim que estiver pronto, você poderá acompanhar os objetivos e contribuir com clareza e foco.
                </p>
              </div>
            </>
        )}

    </div>
  </div>
  
  );
}
