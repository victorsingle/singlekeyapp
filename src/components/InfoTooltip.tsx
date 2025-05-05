import { InfoIcon } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

export function InfoTooltip({
    content,
    className = '',
  }: {
    content: React.ReactNode;
    className?: string;
  }) {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState<'left' | 'right'>('right');
    const tooltipRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (!visible || !tooltipRef.current) return;
  
      const rect = tooltipRef.current.getBoundingClientRect();
      const overflowsRight = rect.right > window.innerWidth;
      const overflowsLeft = rect.left < 0;
  
      if (overflowsRight && !overflowsLeft) {
        setPosition('left');
      } else {
        setPosition('right');
      }
    }, [visible]);
  
    return (
      <div
        className={`relative inline-flex ${className}`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
  
        {visible && (
          <div
            ref={tooltipRef}
            className={`absolute z-50 top-1 w-64 p-2 bg-white border border-gray-200 shadow-lg rounded text-sm text-gray-700 ${
              position === 'right' ? 'left-full ml-2' : 'right-full mr-2'
            }`}
          >
            {content}
          </div>
        )}
      </div>
    );
  }