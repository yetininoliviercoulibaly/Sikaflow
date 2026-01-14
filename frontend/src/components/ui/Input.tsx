
import React from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, startIcon, className, ...props }, ref) => {
    return (
      <div className={styles.container}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputWrapper}>
          {startIcon && <div className={styles.icon}>{startIcon}</div>}
          <input
            ref={ref}
            className={clsx(
              styles.input,
              error && styles.error,
              startIcon && styles.hasIcon,
              className
            )}
            {...props}
          />
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
