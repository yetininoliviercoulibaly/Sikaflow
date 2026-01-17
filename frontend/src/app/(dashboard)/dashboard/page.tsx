'use client';

import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Wallet, Users, QrCode, AlertCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// Mock Data
const STATS = [
  { title: "Chiffre d'Affaires", value: "24,500 €", description: "+12.5% vs mois dernier", icon: Wallet, trend: "+12.5%", trendUp: true },
  { title: "Billets Vendus", value: "1,284", description: "34 aujourd'hui", icon: QrCode, trend: "+5%", trendUp: true },
  { title: "Dépenses", value: "12,300 €", description: "-2.4% vs mois dernier", icon: TrendingDown, trend: "-2.4%", trendUp: true, trendLabel: "Baisse" },
  { title: "Membres Actifs", value: "14", description: "2 nouveaux cette semaine", icon: Users }
];

const RECENT_ACTIVITY = [
    { id: 1, type: 'INCOME', desc: 'Réservation VIP - Table 5', amount: '+500 €', time: 'Il y a 10 min' },
    { id: 2, type: 'EXPENSE', desc: 'Achat Boissons - Fournisseur A', amount: '-1,200 €', time: 'Il y a 2h' },
    { id: 3, type: 'SCAN', desc: 'Entrée scannée - John Doe', amount: 'Valide', time: 'Il y a 3h' },
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

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tableau de Bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Aperçu en temps réel de votre activité.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
                <AlertCircle size={16} /> Rapport
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all">
                <QrCode size={16} /> Scanner
            </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
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
      <div className="grid gap-4 md:grid-cols-7">
        
        {/* Recent Activity */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm p-6 shadow-sm"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg">Activité Récente</h3>
                <Link href="#" className="text-sm text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
                    Voir tout <ArrowRight size={14} />
                </Link>
            </div>
            
            <div className="space-y-4">
                {RECENT_ACTIVITY.map((act) => (
                    <div key={act.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                act.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                act.type === 'EXPENSE' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                            }`}>
                                {act.type === 'INCOME' && <TrendingUp size={18} />}
                                {act.type === 'EXPENSE' && <TrendingDown size={18} />}
                                {act.type === 'SCAN' && <QrCode size={18} />}
                            </div>
                            <div>
                                <p className="font-medium text-sm group-hover:text-indigo-600 transition-colors">{act.desc}</p>
                                <p className="text-xs text-muted-foreground">{act.time}</p>
                            </div>
                        </div>
                        <div className={`font-semibold text-sm ${
                             act.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' :
                             act.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' :
                             'text-slate-600 dark:text-slate-400'
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
             className="col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-4"
        >
            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400 mb-2">
                <TrendingUp size={32} />
            </div>
            <h3 className="font-semibold text-lg">Performance Hebdomadaire</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
                Vos revenus sont en hausse de <span className="text-emerald-500 font-bold">12%</span> cette semaine. Continuez comme ça !
            </p>
            <Button variant="outline" className="mt-4 w-full">Voir les détails</Button>
        </motion.div>
      </div>
    </div>
  );
}
