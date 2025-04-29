import React from 'react';

export function GridExamples() {
  return (
    <div className="space-y-8">
      {/* Tipos de Container */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Exemplos de Container</h3>

        <div className="bg-blue-100 text-blue-900 p-4 rounded shadow">
          <div className="container bg-white p-4 rounded border border-blue-300">
            <p className="text-sm">Container padrão (máx. largura por breakpoint)</p>
          </div>
        </div>

        <div className="bg-green-100 text-green-900 p-4 rounded shadow">
          <div className="container mx-auto px-4 bg-white p-4 rounded border border-green-300">
            <p className="text-sm">Container com margem centralizada e padding horizontal</p>
          </div>
        </div>

        <div className="bg-purple-100 text-purple-900 p-4 rounded shadow">
          <div className="w-full max-w-4xl mx-auto bg-white p-4 rounded border border-purple-300">
            <p className="text-sm">Container customizado (max-w-4xl)</p>
          </div>
        </div>
      </div>

      {/* Grid Layout básico */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-800">Grid Responsivo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 text-center rounded shadow-sm">Coluna 1</div>
          <div className="bg-gray-100 p-4 text-center rounded shadow-sm">Coluna 2</div>
          <div className="bg-gray-100 p-4 text-center rounded shadow-sm">Coluna 3</div>
        </div>
      </div>
    </div>
  );
}
