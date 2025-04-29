import React from 'react';

export function StateExamples() {
  return (
    <div className="space-y-4">
      {/* ✅ Empty State */}
      <div className="p-4 bg-gray-100 rounded text-center text-sm text-gray-600">
        Nenhum dado encontrado.
      </div>

      {/* ✅ Sucesso */}
      <div className="p-4 bg-green-100 text-green-800 text-sm rounded">
        Dados salvos com sucesso!
      </div>

      {/* ✅ Erro */}
      <div className="p-4 bg-red-100 text-red-800 text-sm rounded">
        Ocorreu um erro ao carregar os dados.
      </div>

      {/* ✅ Loading */}
      <div className="p-4 bg-blue-100 text-blue-800 text-sm rounded animate-pulse">
        Carregando...
      </div>
    </div>
  );
}
