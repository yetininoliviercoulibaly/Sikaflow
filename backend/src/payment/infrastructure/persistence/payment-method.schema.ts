
import { EntitySchema } from '@mikro-orm/core';
import { PaymentMethod } from '../../domain/payment-method.entity';

export const PaymentMethodSchema = new EntitySchema<PaymentMethod>({
  class: PaymentMethod,
  tableName: 'payment_method',
  properties: {
    id: { type: 'uuid', primary: true },
    code: { type: 'string', unique: true },
    name: { type: 'string' },
    isActive: { type: 'boolean', default: true },
    supportedCurrencies: { type: 'json' },
    createdAt: { type: 'datetime', defaultRaw: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: 'datetime', defaultRaw: 'CURRENT_TIMESTAMP', onUpdate: () => new Date() },
  },
});
