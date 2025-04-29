import React from 'react';
import { Check, X, Slash } from 'lucide-react';

export function ButtonExamples() {
  return (
    <div className="flex items-center gap-4">
      {/* Normal */}
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>

      {/* Normal Icon*/}
      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      <Check className="flex w-4 h-4" />
        Salvar
      </button>

      {/* Desabilitado */}
      <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed" disabled>
        Desabilitado
      </button>

      {/* Outline */}
      <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded text-xs hover:bg-blue-50">
        Cancelar
      </button>

      {/* Normal Small */}
      <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
        <Check className="flex w-4 h-4 mr-2" />
        Salvar
      </button>

      {/* Desabilitado Small */}
      <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed" disabled>
        Desabilitado
      </button>

      {/* Outline Small */}
      <button className="px-4 py-2 border border-blue-600 text-blue-600 text-xs rounded hover:bg-blue-50">
        Cancelar
      </button>
    </div>
  );
}
