
import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as jwt from 'jsonwebtoken';
import { IQRCodeService } from '../domain/ports/qrcode.service.interface';

@Injectable()
export class QRCodeService implements IQRCodeService {
  private readonly logger = new Logger(QRCodeService.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-me'; // Should be in env

  async generateQRCode(data: string): Promise<Buffer> {
    try {
      // Returns a Data URL, we need Buffer. Or toBuffer()
      return await QRCode.toBuffer(data);
    } catch (error) {
      this.logger.error('Failed to generate QR Code', error);
      throw new Error('QR Generation Failed');
    }
  }

  generateSignedPayload(ticketId: string): string {
    return jwt.sign({ sub: ticketId }, this.jwtSecret); // Token valid indefinitely (validation via DB)
  }

  verifySignedPayload(token: string): string | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { sub: string };
      return decoded.sub;
    } catch (error) {
      this.logger.warn(`Invalid Token verification: ${error.message}`);
      return null;
    }
  }
}
