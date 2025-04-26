import React from 'react';

interface PasswordStrengthSegmentsProps {
  password: string;
}

function calculateStrengthLevel(password: string): 'empty' | 'weak' | 'medium' | 'strong' {
  if (!password) return 'empty'; // Adiciona essa verificação

  let points = 0;
  if (password.length >= 8) points++;
  if (/[A-Z]/.test(password)) points++;
  if (/[0-9]/.test(password)) points++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) points++;

  if (points <= 2) return 'weak';
  if (points === 3) return 'medium';
  return 'strong';
}

export const PasswordStrengthSegments: React.FC<PasswordStrengthSegmentsProps> = ({ password }) => {
  const strength = calculateStrengthLevel(password);

  const getColors = () => {
    if (strength === 'empty') return ['bg-gray-200', 'bg-gray-200', 'bg-gray-200'];
    if (strength === 'weak') return ['bg-red-500', 'bg-gray-200', 'bg-gray-200'];
    if (strength === 'medium') return ['bg-yellow-500', 'bg-yellow-500', 'bg-gray-200'];
    if (strength === 'strong') return ['bg-green-500', 'bg-green-500', 'bg-green-500'];
    return ['bg-gray-200', 'bg-gray-200', 'bg-gray-200'];
  };

  const colors = getColors();

  return (
    <div className="flex space-x-1 mt-2">
      {colors.map((color, index) => (
        <div
          key={index}
          className={`h-1 flex-1 rounded ${color} transition-all duration-300`}
        />
      ))}
    </div>
  );
};
