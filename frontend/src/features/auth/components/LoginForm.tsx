'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authService } from '../services/auth.service';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.requestMagicLink({ phoneNumber });
      setIsSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi du lien.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <Card className={styles.container} glass>
        <div className={styles.success}>
          <h2>Vérifiez votre WhatsApp 📱</h2>
          <p>Un lien de connexion a été envoyé au <strong>{phoneNumber}</strong>.</p>
          <Button 
            variant="outline" 
            onClick={() => setIsSent(false)}
            className={styles.backButton}
          >
            Utiliser un autre numéro
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.container} glass>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h1>Connexion</h1>
          <p>Entrez votre numéro pour recevoir un lien magique sur WhatsApp.</p>
        </div>

        <Input
          label="Numéro de téléphone"
          placeholder="+33 6 00 00 00 00"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          disabled={isLoading}
          error={error || undefined}
        />

        <Button type="submit" isLoading={isLoading} fullWidth>
          Recevoir le lien
        </Button>
      </form>
    </Card>
  );
};
