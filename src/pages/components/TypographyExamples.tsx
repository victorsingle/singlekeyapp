import React from 'react';

export function TypographyExamples() {
  return (
    <div className="space-y-2">
      {/* 🧠 Headings */}
      <h1 className="text-4xl font-bold text-gray-900">Heading 1 (text-4xl)</h1>
      <h2 className="text-3xl font-semibold text-gray-800">Heading 2 (text-3xl)</h2>
      <h3 className="text-2xl font-medium text-gray-700">Heading 3 (text-2xl)</h3>

      {/* 🧠 Paragraphs */}
      <p className="text-base text-gray-600">
        This is a paragraph of base text. It explains something useful and remains readable.
      </p>
      <p className="text-sm text-gray-500">This is a small caption or hint text.</p>
    </div>
  );
}
