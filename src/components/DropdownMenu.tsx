import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DropdownMenu({ trigger, children, disabled = false }: DropdownMenuProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const t = triggerRef.current;
      const d = dropdownRef.current;

      if (
        t &&
        !t.contains(event.target as Node) &&
        d &&
        !d.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right - 192 + window.scrollX, // alinhado à direita, 192px de largura
      });
    }
  }, [showDropdown]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => {
          if (!disabled) setShowDropdown((prev) => !prev);
        }}
        className={disabled ? 'cursor-default opacity-50' : 'cursor-pointer'}
      >
        {trigger}
      </div>

      {showDropdown &&
        createPortal(
          <div
            ref={dropdownRef}
            className="absolute z-[9999] w-48 origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
            style={{
              top: coords.top,
              left: coords.left,
              position: 'absolute',
            }}
          >
            <div className="py-1">
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child, {
                    closeDropdown: () => setShowDropdown(false),
                  });
                }
                return child;
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  closeDropdown?: () => void; // recebido do DropdownMenu
}

export function DropdownMenuItem({ children, onClick, className, closeDropdown }: DropdownMenuItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeDropdown?.(); // força o fechamento sempre
    setTimeout(() => {
      onClick?.();
    }, 0);
  };

  return (
    <button
      onClick={handleClick}
      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className || ''}`}
    >
      {children}
    </button>
  );
}
