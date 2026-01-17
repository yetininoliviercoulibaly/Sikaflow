'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

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
      <Card className={cn('overflow-hidden border-slate-200 dark:border-slate-800 backdrop-blur-sm bg-white/50 dark:bg-slate-950/50 shadow-sm hover:shadow-md transition-shadow', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
          {(description || trend) && (
             <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
               {trend && (
                 <span className={cn("font-medium", trendUp ? "text-emerald-500" : "text-rose-500")}>
                   {trend}
                 </span>
               )}
               <span className="opacity-80">{description}</span>
             </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
