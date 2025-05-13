import { useState } from 'react';
import { Combobox } from '@headlessui/react';

const roles = [
  "Fundador(a)",
  "CEO",
  "Diretor(a)",
  "Gerente",
  "Coordenador(a)",
  "Líder de Equipe",
  "Analista",
  "Consultor(a)",
  "Outro"
];

export function RoleSelector({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [query, setQuery] = useState('');

  const filtered = roles.filter((role) => role.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mt-4">
      <label className="block text-xs text-gray-600 mb-1">Papel na Empresa</label>
      <Combobox value={value} onChange={onChange}>
        <div className="relative">
          <Combobox.Input
            className="w-full border p-2 rounded text-xs"
            placeholder="Ex: CEO, Coordenador de Projetos..."
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.length > 0 && (
            <Combobox.Options className="absolute bg-white shadow border mt-1 w-full rounded z-10">
              {filtered.map((role, i) => (
                <Combobox.Option key={i} value={role} className="px-4 py-2 hover:bg-gray-100 text-sm cursor-pointer">
                  {role}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
    </div>
  );
}
