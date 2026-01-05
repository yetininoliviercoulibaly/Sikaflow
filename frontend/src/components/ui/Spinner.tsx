
import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface SpinnerProps {
  size?: number;
  className?: string;
  color?: string; // Optional color override
}

export const Spinner = ({ size = 24, className, color }: SpinnerProps) => {
  return (
    <Loader2 
      className={clsx("animate-spin", className)} 
      size={size} 
      color={color || 'var(--color-primary)'}
    />
  );
};
