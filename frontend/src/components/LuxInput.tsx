
import React, { useState } from 'react';

interface LuxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const LuxInput: React.FC<LuxInputProps> = ({ label, className = '', ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className={`block text-xs uppercase tracking-widest font-bold transition-colors duration-300 ${isFocused ? 'text-lumen-gold' : 'text-gray-400'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`w-full bg-transparent border-b border-gray-600 py-3 text-chalk-white placeholder-gray-600 focus:outline-none focus:border-prismatic-blue transition-all duration-300 font-sans ${className}`}
        />
        {/* Glow effect line */}
        <div 
          className={`absolute bottom-0 left-0 h-[1px] bg-prismatic-blue shadow-prismatic-glow transition-all duration-500 ease-out ${isFocused ? 'w-full opacity-100' : 'w-0 opacity-0'}`} 
        />
      </div>
    </div>
  );
};
