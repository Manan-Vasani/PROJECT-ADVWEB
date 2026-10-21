import React from 'react';

interface SpinnerProps {
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ label = 'Loading GitHub repositories...' }) => {
  return (
    <div className="spinner-container" aria-live="polite" aria-busy="true">
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <p className="spinner-label">{label}</p>
    </div>
  );
};
