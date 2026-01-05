
import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glass?: boolean;
}

export const Card = ({ children, className, hoverable, glass }: CardProps) => {
  return (
    <div
      className={clsx(
        styles.card,
        hoverable && styles.hoverable,
        glass && styles.glass,
        className
      )}
    >
      {children}
    </div>
  );
};
