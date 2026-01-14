
'use client';

import { Event } from '../types';
import Card from '@/components/ui/Card';
import { Calendar, Users, Ticket } from 'lucide-react';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const soldPercentage = Math.min((event.soldCount / event.totalCapacity) * 100, 100);
  
  return (
    <Card hoverable className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <h3 className={styles.title}>{event.name}</h3>
      </div>
      
      <div className={styles.date}>
        <Calendar size={16} />
        {new Date(event.date).toLocaleDateString()}
      </div>
      
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Vendus</span>
          <span className={styles.statValue}>{event.soldCount}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Capacité</span>
          <span className={styles.statValue}>{event.totalCapacity}</span>
        </div>
      </div>
      
      <div className={styles.progress}>
        <div 
          className={styles.progressBar} 
          style={{ width: `${soldPercentage}%` }}
        />
      </div>
      
      <div className={styles.footer}>
        <span className={styles.price}>{event.price} FCFA</span>
        <div className={styles.date}>
          <Ticket size={16} />
          {event.totalCapacity - event.soldCount} restants
        </div>
      </div>
    </Card>
  );
}
