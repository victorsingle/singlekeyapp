import React, { useState } from 'react';
import { X, Target } from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
  teams: { name: string; description: string }[];
  setTeams: (teams: { name: string; description: string }[]) => void;
}

export function OnboardingStep2({ onNext, onBack, teams, setTeams }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleAddTeam() {
    if (!name.trim()) return;
    setTeams([...teams, { name, description }]);
    setName('');
    setDescription('');
  }

  function handleRemoveTeam(index: number) {
    const updated = [...teams];
    updated.splice(index, 1);
    setTeams(updated);
  }

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="bg-blue-50 rounded-full shadow-inner animate-pulse">
          <Target className="w-14 h-14 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Quem está comprometido?</h1>
        <p className="text-sm text-gray-500 max-w-md">
          Quais são as equipes da sua empresa que precisam focar nos resultados.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <input
          type="text"
          placeholder="Nome do time"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <textarea
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
        />
        <button
          onClick={handleAddTeam}
          className="w-full py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
        >
          Adicionar time
        </button>
      </div>

      <div className="w-full max-w-md flex flex-wrap gap-2 p-2 border border-gray-300 border-dashed rounded">
        {teams.map((team, index) => (
          <div
            key={index}
            className="flex items-center bg-blue-500 text-white text-sm px-3 py-1 rounded-full"
          >
            {team.name}
            <button
              onClick={() => handleRemoveTeam(index)}
              className="ml-2"
              aria-label="Remover time"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {teams.length === 0 && (
          <p className="text-xs text-gray-400 max-w-md mx-auto">Nenhum time adicionado.</p>
        )}
      </div>

      <div className="w-full max-w-md flex justify-between pt-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-blue-600 transition"
        >
          ← Voltar
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-5 py-2 text-sm rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          disabled={teams.length === 0}
        >
          Avançar
        </button>
      </div>
    </div>
  );
}
