
import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import { PaymentMethod } from '../../payment/domain/payment-method.entity';

export class PaymentMethodSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    const methods = [
        { code: 'WAVE', name: 'Wave Mobile Money', isActive: true, supportedCurrencies: ['XOF'] },
        { code: 'STRIPE', name: 'Carte Bancaire', isActive: true, supportedCurrencies: ['EUR', 'USD'] }
    ];

    for (const m of methods) {
        const exists = await em.findOne(PaymentMethod, { code: m.code });
        if (!exists) {
            const method = new PaymentMethod();
            method.code = m.code;
            method.name = m.name;
            method.isActive = m.isActive;
            method.supportedCurrencies = m.supportedCurrencies;
            em.persist(method);
        }
    }
  }

}
