// src/components/ui/button.tsx
import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`
        ${variant === 'default' ? 'bg-primary text-gray-900' : 'border border-gray-600 text-white'}
        ${size === 'sm' ? 'px-3 py-1.5' : size === 'lg' ? 'px-6 py-3' : 'px-4 py-2'}
        rounded-lg font-medium hover:opacity-90 transition-opacity
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}