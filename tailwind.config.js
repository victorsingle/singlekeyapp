/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'ring-pulse': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '20%': { transform: 'scale(1)', opacity: '1' },
          '80%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
      },
      animation: {
        'ring-pulse': 'ring-pulse 1.8s ease-in-out infinite',
      },
    }
  },
  plugins: [],
};
