import { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useOKRStore } from '../stores/okrStore';

interface GenerateOKRButtonProps {
  onGenerate: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function GenerateOKRButton({
  onGenerate,
  disabled = false,
  className = ''
}: GenerateOKRButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isGenerating = useOKRStore(s => s.isGenerating);

  const getLabel = () => {
    if (progress < 30) return 'Analisando contexto...';
    if (progress < 60) return 'Gerando objetivo...';
    if (progress < 90) return 'Montando KRs...';
    return 'Finalizando...';
  };

  const startProgressBar = () => {
    let pct = 0;
    intervalRef.current = setInterval(() => {
      pct += 5;
      setProgress(Math.min(pct, 95));
    }, 100);
  };

  const clearProgressBar = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
  };

  const handleClick = async () => {
    setLoading(true);
    setProgress(0);
    startProgressBar();

    try {
      await onGenerate();
      setProgress(100);
    } catch (err) {
      console.error('[❌ Erro ao gerar OKRs]', err);
    } finally {
      clearProgressBar();
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  // Garante feedback visual se o usuário trocar de aba e voltar
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && loading) {
        setProgress((prev) => (prev < 95 ? prev : 95));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading]);

return (
  <button
    onClick={handleClick}
    disabled={disabled || isGenerating}
    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md relative ${className}`}
  >
    {isGenerating ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {getLabel()}
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all"
          style={{ width: `${progress}%` }}
        />
      </>
    ) : (
      <>
        <Sparkles className="w-4 h-4 mr-2" />
        Gerar Indicadores
      </>
    )}
  </button>
);
}
