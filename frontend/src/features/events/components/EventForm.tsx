
'use client';

import { useState } from 'react';
import { CreateEventDto } from '../types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { X } from 'lucide-react';
import styles from './EventForm.module.css';

interface EventFormProps {
  onSubmit: (data: CreateEventDto) => Promise<void>;
  onClose: () => void;
}

export default function EventForm({ onSubmit, onClose }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventDto>({
    name: '',
    date: '',
    totalCapacity: 500,
    price: 5000
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'événement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <Card className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Nouvel Événement</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          
          <Input
            label="Nom de l'événement"
            placeholder="Ex: Gala Annuel, Concert..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="Date et Heure"
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          
          <div className={styles.row}>
            <Input
              label="Capacité Totale"
              type="number"
              value={formData.totalCapacity}
              onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) })}
              required
            />
            
            <Input
              label="Prix du ticket (FCFA)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
              required
            />
          </div>
          
          <div className={styles.footer}>
            <Button variant="outline" onClick={onClose} type="button">Annuler</Button>
            <Button type="submit" isLoading={loading}>Créer l'Événement</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
