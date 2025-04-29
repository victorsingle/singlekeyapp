import React from 'react';

export function InputExamples() {
  return (
    <div className="space-y-4 max-w-md">
      {/* ✅ Input padrão */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input
          type="text"
          placeholder="Digite seu nome"
          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ✅ Input com erro */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          className="w-full px-3 py-2 border border-red-500 rounded-md text-sm"
          defaultValue="invalido@email"
        />
        <p className="text-xs text-red-500 mt-1">Endereço de e-mail inválido.</p>
      </div>

      {/* ✅ Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
        <select className="w-full px-3 py-2 border rounded-md text-sm">
          <option>Selecione</option>
          <option>Administrador</option>
          <option>Usuário</option>
        </select>
      </div>
    </div>
  );
}
