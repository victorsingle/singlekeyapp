/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'ring-pulse': {
          '0%':   { transform: 'translate(-50%, -50%) scale(0)',   opacity: '0' },
          '20%':  { transform: 'translate(-50%, -50%) scale(1)',   opacity: '1' },
          '80%':  { transform: 'translate(-50%, -50%) scale(1)',   opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(0)',   opacity: '0' },
        },
      },
      animation: {
        'ring-pulse': 'ring-pulse 1.8s ease-in-out infinite',
      },
    }
  },
  plugins: [],
};
