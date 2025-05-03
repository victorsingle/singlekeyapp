import React from 'react';

const circleSequence = [10, 20, 30]; // de dentro pra fora

const LogoBuildLoader = () => {
  return (
    <div className="relative w-[30px] h-[30px] flex items-center justify-center rounded-full">
      {circleSequence.map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full border-[3px] border-blue-500 box-border bg-transparent animate-ring-pulse"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animationDelay: `${i * 100}ms`,
            animationDuration: '1.8s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-out-in',
          }}
        />
      ))}
    </div>
  );
};

export default LogoBuildLoader;
