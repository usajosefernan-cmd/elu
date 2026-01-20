
import React from 'react';

interface LuxButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export const LuxButton: React.FC<LuxButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden rounded-sm";
  
  const variants = {
    primary: "bg-concrete-grey text-lumen-gold border border-transparent hover:bg-[#32323F] hover:shadow-[0_0_15px_rgba(230,199,139,0.3)] hover:border-lumen-gold/30",
    secondary: "bg-transparent border border-concrete-grey text-chalk-white hover:border-lumen-gold/50 hover:text-lumen-gold hover:shadow-[0_0_10px_rgba(230,199,139,0.1)]",
    ghost: "text-prismatic-blue hover:text-white bg-transparent",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Button Content */}
      <span className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>

      {/* Loading State - Lumen Pulse */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-lumen-gold/30 border-t-lumen-gold rounded-full animate-spin"></div>
        </span>
      )}

      {/* Subtle shine effect on hover for primary - "Luz Inteligente" feeling */}
      {variant === 'primary' && !isLoading && !disabled && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1s_infinite] bg-gradient-to-r from-transparent via-lumen-gold/10 to-transparent skew-x-12" />
      )}
    </button>
  );
};
