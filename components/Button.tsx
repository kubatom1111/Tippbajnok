import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseStyle = "font-semibold rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f111a] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  const variants = {
    primary: "bg-sport-primary hover:bg-blue-600 text-white focus:ring-sport-primary shadow-glow",
    secondary: "bg-sport-secondary hover:bg-emerald-600 text-white focus:ring-sport-secondary",
    outline: "border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 shadow-none",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};