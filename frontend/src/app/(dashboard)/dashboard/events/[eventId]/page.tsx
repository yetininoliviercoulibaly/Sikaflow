
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventService } from '@/features/events/services/event.service';
import { Event, EventStats } from '@/features/events/types';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { Calendar, Tag, ArrowLeft, QrCode, TrendingUp, Users, Ticket } from 'lucide-react';
import styles from './EventDetailsPage.module.css';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        const [eventData, statsData] = await Promise.all([
          EventService.getEvent(eventId),
          EventService.getEventStats(eventId)
        ]);
        setEvent(eventData);
        setStats(statsData);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les détails de l'événement.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size={48} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Événement introuvable.'}</p>
          <Button onClick={() => router.push('/dashboard/events')} variant="outline">
            Retour aux événements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Button 
        variant="ghost" 
        onClick={() => router.push('/dashboard/events')} 
        className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
      >
        <ArrowLeft size={20} className="mr-2" /> Retour
      </Button>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.subtitle}>
            <Calendar size={16} className="inline mr-2" />
            {new Date(event.date).toLocaleDateString()}
          </div>
        </div>
        <Button variant="outline" onClick={() => {}}>Modifier</Button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>BILLETS VENDUS</div>
          <div className={styles.statValue}>
            {event.soldCount} <span className="text-sm text-neutral-400 font-normal">/ {event.totalCapacity}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>REVENUS</div>
          <div className={styles.statValue}>{stats?.revenue || 0} FCFA</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TAUX DE REMPLISSAGE</div>
          <div className={styles.statValue}>
             {event.totalCapacity > 0 ? Math.round((event.soldCount / event.totalCapacity) * 100) : 0}%
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 mt-8">Actions Rapides</h2>
      <div className={styles.actions}>
        <Link href={`/dashboard/events/${eventId}/categories`} className={styles.actionCard}>
          <Tag size={40} className={styles.actionIcon} />
          <div className={styles.actionTitle}>Gérer les Catégories</div>
          <div className={styles.actionDesc}>Prix, quotas et types de billets</div>
        </Link>
        
        <div className={styles.actionCard} onClick={() => alert("Scanner web bientôt disponible")}>
          <QrCode size={40} className={styles.actionIcon} />
          <div className={styles.actionTitle}>Ouvrir le Scanner</div>
          <div className={styles.actionDesc}>Contrôler les entrées</div>
        </div>

        <div className={styles.actionCard} onClick={() => alert("Rapport détaillé bientôt disponible")}>
          <TrendingUp size={40} className={styles.actionIcon} />
          <div className={styles.actionTitle}>Voir le Rapport</div>
          <div className={styles.actionDesc}>Analyse détaillée des ventes</div>
        </div>
      </div>
    </div>
  );
}
