
'use client';

import { useEffect, useState } from 'react';
import { EventService } from '@/features/events/services/event.service';
import { Event } from '@/features/events/types';
import EventCard from '@/features/events/components/EventCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Plus, RefreshCcw } from 'lucide-react';
import styles from './EventsPage.module.css';
import EventForm from '@/features/events/components/EventForm';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await EventService.listEvents();
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError('Impossible de charger les événements.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (data: any) => {
    await EventService.createEvent(data);
    await fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Événements</h1>
          <p className={styles.subtitle}>Gérez vos événements et suivez les ventes en temps réel.</p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" onClick={fetchEvents} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button startIcon={<Plus size={20} />} onClick={() => setShowForm(true)}>
            Nouvel Événement
          </Button>
        </div>
      </div>

      {showForm && (
        <EventForm 
          onClose={() => setShowForm(false)} 
          onSubmit={handleCreateEvent} 
        />
      )}

      {loading && events.length === 0 ? (
        <div className={styles.loading}>
          <Spinner size={48} />
          <p>Chargement des événements...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <p>{error}</p>
          <Button onClick={fetchEvents} variant="outline" size="sm">Réessayer</Button>
        </div>
      ) : events.length === 0 ? (
        <div className={styles.empty}>
          <p>Vous n'avez pas encore d'événements.</p>
          <Button size="md">Créer mon premier événement</Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
