import React, { useState } from 'react';
import { Sparkles, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { useOKRStore } from '../stores/okrStore';

interface OKRGeneratorProps {
  onFinish: (cycleId: string) => void;
  onManualStart: () => void;
  isModal?: boolean;
  fromList?: boolean;
}

export function OKRGenerator({ onFinish, onManualStart, isModal = false, fromList = false }: OKRGeneratorProps) {
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const minChars = 350;
  const { generateFullOKRStructure } = useOKRStore();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cycleId = await generateFullOKRStructure(context);
      toast.success('OKRs gerados com sucesso!');
      setContext('');
      onFinish(cycleId);
    } catch (error) {
      console.error('Erro ao gerar estrutura completa:', error);
      toast.error('Erro ao gerar OKRs.');
    } finally {
      setLoading(false);
    }
  };

  // 💡 Controla animação do ícone com base em estado
  const avatarAnimation = loading
    ? 'animate-pulse'
    : context.length === 0
    ? 'animate-bounce'
    : '';

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

      <form onSubmit={handleGenerate} className="space-y-4">
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
      
      {/* TÍTULO */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Eu sou a <span className="text-blue-600">KAI</span>, sua copiloto de OKRs
        </h1>
        <p className="text-sm text-gray-500">
          Me diga qual é o desafio do próximo ciclo e eu cuido do resto.
        </p>
      </div>

      {/* FORM */}
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="relative">
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ex: Precisamos expandir nossa atuação no mercado B2B focando em empresas de médio porte. A meta é aumentar 30% da receita nos próximos 3 meses, melhorar a aquisição de clientes, reforçar nossa presença digital, ampliar o time de vendas e reduzir o ciclo de conversão em 20% sem perder qualidade...."
              className="w-full text-xs h-32 text-sm p-4 rounded-xl bg-white resize-none shadow-[0_20px_50px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-gray-400">
              {context.length} / 350
              {context.length < 350 && (
                <span className="text-red-500 ml-2">Mínimo de 350</span>
              )}
            </div>
          </div>

          {/* Botão principal */}
          <div className="flex justify-center pt-2">
            <button 
              type="submit"
              disabled={context.length < 350 || loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Gerando..." : "Gerar com a KAI"}
            </button>
          </div>
        </form>

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

    </div>
  </div>
  
  );
}
