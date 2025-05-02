import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

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

  const getLabel = () => {
    if (progress < 30) return 'Analisando contexto...';
    if (progress < 60) return 'Gerando objetivo...';
    if (progress < 90) return 'Montando KRs...';
    return 'Finalizando...';
  };

  const handleClick = async () => {
    setLoading(true);
    setProgress(0);

    let pct = 0;
    const interval = setInterval(() => {
      pct += 5;
      setProgress(Math.min(pct, 95));
    }, 100);

    try {
      await onGenerate();
      setProgress(100);
    } catch (err) {
      console.error('[❌ Erro ao gerar OKRs]', err);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 600);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md relative ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {getLabel()}
          <div
            className="absolute bottom-0 left-0 h-1 bg-white/40"
            style={{ width: `${progress}%` }}
          />
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar com a KAI
        </>
      )}
    </button>
  );
}
