'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { LayoutDashboard, Calendar, Building2, FileText, LogOut, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
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
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Événements', href: '/dashboard/events', icon: Calendar },
    { name: 'Organisations', href: '/dashboard/organizations', icon: Building2 },
    { name: 'Rapports', href: '/dashboard/reports', icon: FileText },
  ];

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          SikaFlow
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={isActive ? styles.navItemActive : styles.navItem}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button 
          className={styles.logout}
          onClick={() => {
            localStorage.removeItem('auth_token');
            router.push('/login');
          }}
        >
          <LogOut size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'text-bottom' }} />
          Déconnexion
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {pathname === '/dashboard' ? 'Vue d\'ensemble' : 
                navItems.find(n => n.href === pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
            <div className={styles.userProfile}>
                <span>Admin</span>
            </div>
          </div>
        </header>

        <section className={styles.content}>
          {children}
        </section>
      </main>
    </div>
  );
}
