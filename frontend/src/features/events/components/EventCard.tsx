
'use client';

import { Event } from '../types';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { Calendar, Users, Ticket, Tag } from 'lucide-react';
import styles from './EventCard.module.css';

import { useRouter } from 'next/navigation';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const router = useRouter();
  const soldPercentage = Math.min((event.soldCount / event.totalCapacity) * 100, 100);
  
  const handleCardClick = () => {
    if (onClick) onClick();
    else router.push(`/dashboard/events/${event.id}`);
  };
  
  return (
    <Card hoverable className={styles.card} onClick={handleCardClick}>
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
        <div className={styles.actions}>
          <Link href={`/dashboard/events/${event.id}/categories`} className={styles.categoryLink} onClick={(e) => e.stopPropagation()}>
            <Tag size={16} />
            Catégories
          </Link>
        </div>
      </div>
    </Card>
  );
}
