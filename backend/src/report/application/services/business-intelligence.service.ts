import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transaction, TransactionType } from '../../../transaction/domain/transaction.entity';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { Organization } from '../../../organization/domain/organization.entity';
import { getCurrency } from '../../../common/utils/currency.util';

// Metrics that require OWNER or MANAGER role
const RESTRICTED_METRICS = ['MARGIN', 'PROFIT', 'NET_INCOME'];

@Injectable()
export class BusinessIntelligenceService {
  constructor(private readonly em: EntityManager) {}

  private async getOrganizationCurrency(organizationId: string | undefined): Promise<string> {
    if (!organizationId) return getCurrency();
    const result = await this.em.getConnection().execute(
      `SELECT settings FROM "organization" WHERE id = ?`,
      [organizationId]
    );
    const settings = result[0]?.settings;
    return settings?.currency || getCurrency();
  }

  async getMetric(organizationId: string | undefined, metric: string, period?: string, date?: string, userRole?: UserRole): Promise<string> {
    
    // US.10: Role-Based Access Control
    if (userRole === UserRole.STAFF && (RESTRICTED_METRICS.includes(metric) || metric === 'NET_PROFIT')) {
      return "⛔ Accès refusé. Les données de marge et profit sont réservées aux Managers et Propriétaires.";
    }
    
    // Date Range Calculation
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let periodLabel = period || (date ? date : 'today');

    // Helper to set start/end of day
    const startOfDay = (d: Date) => { d.setHours(0,0,0,0); return d; };
    const endOfDay = (d: Date) => { d.setHours(23,59,59,999); return d; };

    const currency = await this.getOrganizationCurrency(organizationId);

    if (date) {
        // Specific Date logic
        startDate = new Date(date);
        startOfDay(startDate);
        endDate = new Date(date);
        endOfDay(endDate);
        periodLabel = `le ${date}`;
    } else if (period === 'yesterday') {
        startDate.setDate(now.getDate() - 1);
        startOfDay(startDate);
        endDate.setDate(now.getDate() - 1);
        endOfDay(endDate);
        periodLabel = 'hier';
    } else if (period === 'this_week') {
        const day = now.getDay() || 7; 
        if (day !== 1) {             
            startDate.setHours(-24 * (day - 1)); 
        } else {
             startDate.setHours(0,0,0,0);
        }
        periodLabel = 'cette semaine';
    } else if (period === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startOfDay(startDate);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endOfDay(endDate);
        periodLabel = 'le mois dernier';
    } else if (period === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfDay(startDate);
        periodLabel = 'ce mois';
    } else if (period === 'this_year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        startOfDay(startDate);
        periodLabel = 'cette année';
    } else if (period === 'this_semester') {
        const currentMonth = now.getMonth(); // 0-11
        const startMonth = currentMonth < 6 ? 0 : 6;
        startDate = new Date(now.getFullYear(), startMonth, 1);
        startOfDay(startDate);
        periodLabel = 'ce semestre';
    } else if (period === 'last_semester') {
        const currentMonth = now.getMonth();
        if (currentMonth < 6) {
             // Last semester was Jul-Dec of previous year
             startDate = new Date(now.getFullYear() - 1, 6, 1);
             endDate = new Date(now.getFullYear() - 1, 11, 31);
        } else {
             // Last semester was Jan-Jun of current year
             startDate = new Date(now.getFullYear(), 0, 1);
             endDate = new Date(now.getFullYear(), 5, 30);
        }
        startOfDay(startDate);
        endOfDay(endDate);
        periodLabel = 'le semestre dernier';
    } else if (period === 'this_quarter') {
        const currentMonth = now.getMonth();
        const startMonth = Math.floor(currentMonth / 3) * 3;
        startDate = new Date(now.getFullYear(), startMonth, 1);
        startOfDay(startDate);
        periodLabel = 'ce trimestre';
    } else if (period === 'last_quarter') {
        const currentMonth = now.getMonth();
        const startMonth = Math.floor(currentMonth / 3) * 3;
        // Go back 3 months
        startDate = new Date(now.getFullYear(), startMonth - 3, 1);
        startOfDay(startDate);
        // End date is day before start of this quarter
        endDate = new Date(now.getFullYear(), startMonth, 0);
        endOfDay(endDate);
        periodLabel = 'le trimestre dernier';
    } else if (period && period.match(/^last_(\d+)_years$/)) {
        const match = period.match(/^last_(\d+)_years$/);
        const years = parseInt(match![1], 10);
        startDate = new Date(now.getFullYear() - years, now.getMonth(), now.getDate()); // Or just Jan 1st? Usually "last N years" implies rolling or calendar. Let's do rolling from exactly N years ago.
        // User request "sur les N dernieres annees" usually means "last N calendar years" or "rolling"?
        // Let's do Calendar years for accounting: Jan 1st (Year - N) to Today.
        startDate = new Date(now.getFullYear() - years, 0, 1);
        startOfDay(startDate);
        periodLabel = `les ${years} dernières années`;
    } else {
        // Default to TODAY
        startOfDay(startDate);
        periodLabel = "aujourd'hui";
    }

    // Special Case for NET_PROFIT
    if (metric === 'NET_PROFIT') {
        // Helper to run query
        const runQuery = async (type: 'INCOME' | 'EXPENSE') => {
            let sql = `SELECT SUM(amount) as sum FROM "transaction" WHERE transaction_date >= ? AND transaction_date <= ? AND type = ?`;
            const params: any[] = [startDate.toISOString(), endDate.toISOString(), type];
            if (organizationId) {
                sql += ` AND organization_id = ?`;
                params.push(organizationId);
            }
            const res = await this.em.getConnection().execute(sql, params);
            return Number(res[0]?.sum || 0);
        };

        const revenue = await runQuery('INCOME');
        const expenses = await runQuery('EXPENSE');
        const profit = revenue - expenses;
        const formatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(profit);
        return `Le Bénéfice Net (${periodLabel}) est de ${formatted}`;
    }

    // Build Date Filter for standard metrics
    let dateFilter = '1=1';
    const params: any[] = [];
    
    // Postgres Parameters using $1, $2, etc is standard, but MikroORM execute usually takes ? or depends on driver. 
    // Let's use string interpolation for dates CAREFULLY or better: em.getConnection().execute(sql, params)
    
    const formattedStart = startDate.toISOString();
    const formattedEnd = endDate.toISOString();

    let sql = `SELECT SUM(amount) as sum FROM "transaction" WHERE transaction_date >= ? AND transaction_date <= ?`;
    params.push(formattedStart, formattedEnd);

    if (organizationId) {
        sql += ` AND organization_id = ?`;
        params.push(organizationId);
    }
    
    let result = 0;
    let label = '';

    switch (metric) {
        case 'REVENUE':
            label = 'Chiffre d\'Affaire';
            sql += ` AND type = 'INCOME'`;
            break;
        case 'EXPENSES':
            label = 'Dépenses';
            sql += ` AND type = 'EXPENSE'`;
            break;
        case 'TIPS':
             label = 'Pourboires';
             sql += ` AND category = 'Tips'`;
             break;
        default:
            return "Désolé, je ne connais pas cette métrique.";
    }

    const res = await this.em.getConnection().execute(sql, params);
    // res can be array or object depending on driver. Postgres usually returns array.
    result = res[0]?.sum || 0;

    // Format Number
    const formatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(result));

    return `Le montant pour ${label} (${periodLabel}) est de ${formatted}`;
  }

  async getRawMetric(organizationId: string, metric: string, startDate: Date, endDate: Date): Promise<number> {
    
    // Build Date Filter
    const formattedStart = startDate.toISOString();
    const formattedEnd = endDate.toISOString();

    let sql = `SELECT SUM(amount) as sum FROM "transaction" WHERE transaction_date >= ? AND transaction_date <= ? AND organization_id = ?`;
    const params: any[] = [formattedStart, formattedEnd, organizationId];

    switch (metric) {
        case 'REVENUE':
            sql += ` AND type = 'INCOME'`;
            break;
        case 'EXPENSES':
            sql += ` AND type = 'EXPENSE'`;
            break;
        case 'TIPS':
             sql += ` AND category = 'Tips'`;
             break;
        default:
            return 0;
    }

    const res = await this.em.getConnection().execute(sql, params);
    // Handle Postgres/MikroORM raw result structure
    // Usually Array<{sum: number}>
    const val = res[0]?.sum; 
    return val ? Number(val) : 0;
  }
}
