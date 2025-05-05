import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { InfoIcon } from 'lucide-react';

export function InfoTooltip({
  content,
  className = '',
}: {
  content: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const { x, y, refs, strategy } = useFloating({
    placement: 'right',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div
      ref={refs.setReference}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />

      {open &&
        createPortal(
          <div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
            }}
            className="z-[9999] w-64 p-2 bg-white border border-gray-200 shadow-lg rounded text-sm text-gray-700"
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  );
}
