import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DropdownMenu({ trigger, children, disabled = false }: DropdownMenuProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fecha quando ficar desabilitado
  useEffect(() => {
    if (disabled) {
      setShowDropdown(false);
    }
  }, [disabled]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div
        onClick={() => {
          if (!disabled) setShowDropdown((prev) => !prev);
        }}
        className={disabled ? 'cursor-default opacity-50' : 'cursor-pointer'}
      >
        {trigger}
      </div>

      {showDropdown && (
        <div className="absolute right-0 z-[60] mt-2 w-48 origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className || ''}`}
    >
      {children}
    </button>
  );
}
