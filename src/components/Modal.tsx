import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  actions?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  type = 'info',
  actions,
}: ModalProps) {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: 'bg-green-50', title: 'text-green-900' };
      case 'warning':
        return { bg: 'bg-yellow-50', title: 'text-yellow-900' };
      case 'error':
        return { bg: 'bg-red-50', title: 'text-red-900' };
      default:
        return { bg: 'bg-blue-50', title: 'text-blue-900' };
    }
  };

  const { bg, title: titleColor } = getColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 py-8">
      <div className={`w-full max-w-lg rounded-lg shadow-xl overflow-hidden ${bg}`}>
        <div className="px-6 py-5 sm:p-6">
          <div className="flex items-start justify-between">
            <h3 className={`text-lg font-semibold ${titleColor}`}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-700">
            {children}
          </div>

          {actions && (
            <div className="mt-6 flex justify-end gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
