'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className={styles.loading}>
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Event Pilot</div>
        <nav className={styles.nav}>
          <div className={styles.navItemActive}>Tableau de bord</div>
          <div className={styles.navItem}>Événements</div>
          <div className={styles.navItem}>Organisations</div>
          <div className={styles.navItem}>Rapports</div>
        </nav>
        <button 
          className={styles.logout}
          onClick={() => {
            localStorage.removeItem('auth_token');
            router.push('/login');
          }}
        >
          Déconnexion
        </button>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
          <div className={styles.userProfile}>Admin</div>
        </header>
        <section className={styles.content}>
          {children}
        </section>
      </main>
    </div>
  );
}
