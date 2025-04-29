import React, { useState } from 'react';
import { Sparkles, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { useOKRStore } from '../stores/okrStore';

interface OKRGeneratorProps {
  onFinish: (cycleId: string) => void;
  onManualStart: () => void;
  isModal?: boolean;
}

export function OKRGenerator({ onFinish, onManualStart, isModal = false }: OKRGeneratorProps) {
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
    <section className="w-full max-w-3xl mx-auto mt-0 p-0 rounded-xl text-center">
      <div className="p-5">
        <div className="flex justify-center items-center mb-2">
          <div className={`${avatarAnimation} bg-blue-50 p-3 rounded-full shadow-inner`}>
            <Target className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Eu sou a KAI, sua copiloto de OKRs</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Me diga qual é o seu desafio do próximo ciclo e eu cuido do resto.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full h-[200px] p-4 border rounded-xl resize-none text-sm leading-relaxed mb-0"
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
            'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold',
            'bg-blue-600 hover:bg-blue-700 transition',
            (loading || context.length < minChars) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {loading ? (
            <span>Gerando...</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Novo Ciclo
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onManualStart}
          className="w-full flex items-center border justify-center gap-2 py-3 px-6 rounded-xl text-blue-600 bg-white !mt-[10px] hover:bg-gray-100 transition"
        >
          Criar Manualmente
        </button>
      </form>
    </section>
  );
}
