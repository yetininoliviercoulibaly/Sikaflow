
import { v4 } from 'uuid';

export class PaymentMethod {
  id: string = v4();
  code!: string; // WAVE, STRIPE, ORANGE_MONEY
  name!: string; // 'Wave Mobile Money', 'Carte Bancaire'
  isActive: boolean = true;
  supportedCurrencies!: string[]; // ['XOF'], ['EUR', 'USD']
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
