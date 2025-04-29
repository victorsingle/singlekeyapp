import React from 'react';
import { ButtonExamples } from './components/ButtonExamples';
import { CardExamples } from './components/CardExamples';
import { GridExamples } from './components/GridExamples';
import { InputExamples } from './components/InputExamples';
import { StateExamples } from './components/StateExamples';
import { TypographyExamples } from './components/TypographyExamples';
import { OKRCardEditable  } from './components/OKRCardEditable';


export function GuidePage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-10 space-y-16 bg-gray-50 min-h-screen">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">SingleKey Design Guide</h1>
      </header>

      {/* Typography Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Typography</h2>
        <TypographyExamples />
      </section>

      {/* Button Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Buttons</h2>
        <ButtonExamples />
      </section>

      {/* Input / Form Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Form Elements</h2>
        <InputExamples />
      </section>

      {/* Grid System */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Grid Layouts</h2>
        <p className="text-sm text-gray-500">Amostras de colunas, containers, espaçamentos e alinhamentos</p>
        <GridExamples />
      </section>

      {/* Reusable Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Card Components</h2>
        <CardExamples />
      </section>

      {/* Reusable OKRs Editable */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">OKR Cards Editáveis</h2>
        <OKRCardEditable
            id="1"
            level={0}
            type="strategic"
            status="draft"
            objective="Expandir presença internacional"
            keyResults={[
                {
                id: 'kr1',
                text: 'Abrir operação no Chile',
                metric: 'Clientes Ativos',
                initialValue: 0,
                currentValue: 10,
                targetValue: 20,
                },
            ]}
            />

            <OKRCardEditable
            id="2"
            level={1}
            type="tactical"
            status="draft"
            objective="Estabelecer base regional"
            keyResults={[]}
            />

            <OKRCardEditable
            id="3"
            level={2}
            type="operational"
            status="draft"
            objective="Contratar gerente local"
            keyResults={[]}
            />
      </section>

      {/* State / Feedback Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">UI States</h2>
        <StateExamples />
      </section>
    </div>
  );
}
