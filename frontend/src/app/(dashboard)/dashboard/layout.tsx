'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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

  const navItems = [
    { name: 'Tableau de bord', href: '/dashboard', active: pathname === '/dashboard' },
    { name: 'Événements', href: '/dashboard/events', active: pathname === '/dashboard/events' },
    { name: 'Organisations', href: '/dashboard/organizations', active: pathname === '/dashboard/organizations' },
    { name: 'Rapports', href: '/dashboard/reports', active: pathname === '/dashboard/reports' },
  ];

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Event Pilot</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={item.active ? styles.navItemActive : styles.navItem}
            >
              {item.name}
            </Link>
          ))}
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
          <h1>
            {pathname === '/dashboard' ? 'Overview' : 
             pathname.startsWith('/dashboard/events') ? 'Événements' :
             pathname.startsWith('/dashboard/organizations') ? 'Organisations' :
             'Rapports'}
          </h1>
          <div className={styles.userProfile}>Admin</div>
        </header>
        <section className={styles.content}>
          {children}
        </section>
      </main>
    </div>
  );
}
