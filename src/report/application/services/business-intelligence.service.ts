import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Transaction, TransactionType } from '../../../transaction/domain/transaction.entity';
import { UserRole } from '../../../organization/domain/organization-member.entity';

// Metrics that require OWNER or MANAGER role
const RESTRICTED_METRICS = ['MARGIN', 'PROFIT', 'NET_INCOME'];

@Injectable()
export class BusinessIntelligenceService {
  constructor(private readonly em: EntityManager) {}

  async getMetric(organizationId: string | undefined, metric: string, period?: string, date?: string, userRole?: UserRole): Promise<string> {
    
    // US.10: Role-Based Access Control
    if (userRole === UserRole.STAFF && RESTRICTED_METRICS.includes(metric)) {
      return "⛔ Accès refusé. Les données de marge et profit sont réservées aux Managers et Propriétaires.";
    }
    
    // Date Range Calculation
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let periodLabel = period || (date ? date : 'today');

    if (date) {
        // Specific Date logic
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = `le ${date}`;
    } else if (period === 'yesterday') {
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'hier';
    } else if (period === 'this_week') {
        const day = now.getDay() || 7; 
        if (day !== 1) {             
            startDate.setHours(-24 * (day - 1)); 
        } else {
             startDate.setHours(0,0,0,0);
        }
        periodLabel = 'cette semaine';
    } else {
        // Default to TODAY
        startDate.setHours(0, 0, 0, 0);
        periodLabel = "aujourd'hui";
    }

    // Build Date Filter
    let dateFilter = '1=1';
    const params: any[] = [];
    
    // Postgres Parameters using $1, $2, etc is standard, but MikroORM execute usually takes ? or depends on driver. 
    // Let's use string interpolation for dates CAREFULLY or better: em.getConnection().execute(sql, params)
    
    // Simplification: Use QueryBuilder via explicit import if possible, or Raw.
    // Let's try Raw with simple logic.
    
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

    // Format Number (FCFA roughly)
    const formatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(result));

    return `Le montant pour ${label} (${periodLabel}) est de ${formatted}`;
  }
}
