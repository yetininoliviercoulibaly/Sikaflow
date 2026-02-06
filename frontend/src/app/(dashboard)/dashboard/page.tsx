'use client';

import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Wallet, Users, HandCoins, AlertCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import styles from './DashboardPage.module.css';

// Mock Data
const STATS = [
  { title: "Chiffre d'Affaires", value: "24,500 €", description: "+12.5% vs mois dernier", icon: Wallet, trend: "+12.5%", trendUp: true },
  { title: "Créances en cours", value: "8", description: "3 nouvelles cette semaine", icon: HandCoins, trend: "+2", trendUp: false },
  { title: "Dépenses", value: "12,300 €", description: "-2.4% vs mois dernier", icon: TrendingDown, trend: "-2.4%", trendUp: true, trendLabel: "Baisse" },
  { title: "Membres Actifs", value: "14", description: "2 nouveaux cette semaine", icon: Users }
];

const RECENT_ACTIVITY = [
    { id: 1, type: 'INCOME', desc: 'Réservation VIP - Table 5', amount: '+500 €', time: 'Il y a 10 min' },
    { id: 2, type: 'EXPENSE', desc: 'Achat Boissons - Fournisseur A', amount: '-1,200 €', time: 'Il y a 2h' },
    { id: 3, type: 'DEBT', desc: 'Créance - Bakary doit 5,000 F', amount: '+5,000 F', time: 'Il y a 3h' },
    { id: 4, type: 'INCOME', desc: 'Entrée Standard x2', amount: '+40 €', time: 'Hier' }
];

export default function DashboardPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>Tableau de Bord</h1>
          <p>Aperçu en temps réel de votre activité.</p>
        </div>
        <div className={styles.actions}>
            <Button variant="outline" startIcon={<AlertCircle size={16} />}>
                 Rapport
            </Button>
            <Button variant="primary" startIcon={<HandCoins size={16} />}>
                 Nouvelle Créance
            </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className={styles.statsGrid}
      >
        {STATS.map((stat, i) => (
          <AnimatedCard 
            key={i}
            {...stat}
            delay={i}
          />
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        
        {/* Recent Activity */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className={styles.recentActivity}
        >
            <div className={styles.sectionHeader}>
                <h3>Activité Récente</h3>
                <Link href="#" className={styles.link}>
                    Voir tout <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className={styles.activityList}>
                {RECENT_ACTIVITY.map((act) => (
                    <div key={act.id} className={styles.activityItem}>
                        <div className={styles.activityInfo}>
                            <div className={`${styles.iconWrapper} ${
                                act.type === 'INCOME' ? styles.incomeIcon :
                                act.type === 'EXPENSE' ? styles.expenseIcon :
                                styles.debtIcon
                            }`}>
                                {act.type === 'INCOME' && <TrendingUp size={18} />}
                                {act.type === 'EXPENSE' && <TrendingDown size={18} />}
                                {act.type === 'DEBT' && <HandCoins size={18} />}
                            </div>
                            <div className={styles.activityText}>
                                <p>{act.desc}</p>
                                <p>{act.time}</p>
                            </div>
                        </div>
                        <div className={`${styles.amount} ${
                             act.type === 'INCOME' ? styles.amountIncome :
                             act.type === 'EXPENSE' ? styles.amountExpense :
                             styles.amountNeutral
                        }`}>
                            {act.amount}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>

        {/* Quick Actions / Chart Placeholder */}
        <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.5, duration: 0.5 }}
             className={styles.performanceCard}
        >
            <div className={styles.performanceIcon}>
                <TrendingUp size={32} />
            </div>
            <h3>Performance Hebdomadaire</h3>
            <p>
                Vos revenus sont en hausse de <span className={styles.highlight}>12%</span> cette semaine. Continuez comme ça !
            </p>
            <Button variant="outline" fullWidth style={{ marginTop: '1rem' }}>Voir les détails</Button>
        </motion.div>
      </div>
    </div>
  );
}
