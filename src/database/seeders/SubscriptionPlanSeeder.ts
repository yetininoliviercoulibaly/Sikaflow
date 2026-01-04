
import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import { SubscriptionPlan } from '../../subscription/domain/subscription-plan.entity';
import { PaymentMethod } from '../../payment/domain/payment-method.entity';

export class SubscriptionPlanSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    const wave = await em.findOne(PaymentMethod, { code: 'WAVE' });
    const stripe = await em.findOne(PaymentMethod, { code: 'STRIPE' });

    if (wave) {
        const wavePlans = [
            { name: 'Pass Trimestriel', price: 15000, currency: 'XOF', durationMonths: 3, description: 'Abonnement 3 Mois' },
            { name: 'Pass Annuel', price: 50000, currency: 'XOF', durationMonths: 12, description: 'Abonnement 1 An (Best Value)' }
        ];

        for (const p of wavePlans) {
             const exists = await em.findOne(SubscriptionPlan, { name: p.name, paymentMethod: wave });
             if (!exists) {
                 const plan = new SubscriptionPlan();
                 plan.name = p.name;
                 plan.price = p.price;
                 plan.currency = p.currency;
                 plan.durationMonths = p.durationMonths;
                 plan.paymentMethod = wave;
                 plan.description = p.description;
                 em.persist(plan);
             }
        }
    }

    if (stripe) {
         const stripePlan = { name: 'Premium Mensuel', price: 9.99, currency: 'EUR', durationMonths: 1, description: 'Abonnement Mensuel Flexible' };
         const exists = await em.findOne(SubscriptionPlan, { name: stripePlan.name, paymentMethod: stripe });
         if (!exists) {
             const plan = new SubscriptionPlan();
             plan.name = stripePlan.name;
             plan.price = stripePlan.price;
             plan.currency = stripePlan.currency;
             plan.durationMonths = stripePlan.durationMonths;
             plan.paymentMethod = stripe;
             plan.description = stripePlan.description;
             em.persist(plan);
         }
    }
  }

}
