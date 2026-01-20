'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';
import styles from './Card.module.css';

interface AnimatedCardProps {
  title: string;
  value?: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  delay?: number;
}

export function AnimatedCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendUp,
  className,
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className={clsx(styles.animatedCard, className)}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>
            {title}
          </CardTitle>
          {Icon && <Icon className={styles.cardIcon} />}
        </CardHeader>
        <CardContent>
          <div className={styles.cardValue}>{value}</div>
          {(description || trend) && (
             <p className={styles.cardDescription}>
               {trend && (
                 <span className={clsx(styles.trend, trendUp ? styles.trendUp : styles.trendDown)}>
                   {trend}
                 </span>
               )}
               <span className={styles.descriptionText}>{description}</span>
             </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
