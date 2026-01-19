'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        padding: '3rem',
        borderRadius: '1rem',
        textAlign: 'center',
        maxWidth: '400px',
      }}>
        {error ? (
          <>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>😕 Oups !</h1>
            <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Retour à la connexion
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite',
            }} />
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Vérification en cours...</h1>
            <p style={{ opacity: 0.7 }}>Nous sécurisons votre session, un instant.</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthVerifyPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
        color: 'white',
      }}>
        <p>Chargement...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
