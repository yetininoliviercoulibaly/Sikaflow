'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authService } from '@/features/auth/services/auth.service';
import styles from './VerifyPage.module.css';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const verifying = useRef(false);

  useEffect(() => {
    if (!token) {
      setError('Token manquant ou invalide.');
      return;
    }

    if (verifying.current) return;
    verifying.current = true;

    const verify = async () => {
      try {
        const response = await authService.verifyMagicLink(token);
        localStorage.setItem('auth_token', response.accessToken);
        router.push('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Échec de la vérification du lien.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <Card className={styles.container} glass>
      {error ? (
        <div className={styles.content}>
          <h1 className={styles.errorTitle}>Oups ! 😕</h1>
          <p className={styles.message}>{error}</p>
          <Button onClick={() => router.push('/login')} fullWidth>
            Retour à la connexion
          </Button>
        </div>
      ) : (
        <div className={styles.content}>
          <Spinner size={48} />
          <h1>Vérification en cours...</h1>
          <p className={styles.message}>Nous sécurisons votre session, un instant.</p>
        </div>
      )}
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={
        <Card className={styles.container} glass>
          <div className={styles.content}>
            <Spinner size={48} />
            <h1>Chargement...</h1>
          </div>
        </Card>
      }>
        <VerifyContent />
      </Suspense>
    </main>
  );
}
