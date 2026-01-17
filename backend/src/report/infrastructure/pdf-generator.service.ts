import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { IPdfGeneratorService } from '../domain/ports/pdf-generator-service.interface';

@Injectable()
export class PdfGeneratorServiceImpl implements IPdfGeneratorService {
  async generateReportPdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(25).text('SikaFlow Report', { align: 'center' });
      doc.moveDown();

      // Content
      doc.fontSize(12).text(`Generated at: ${new Date().toLocaleString()}`);
      doc.moveDown();

      if (data.title) {
          doc.fontSize(18).text(data.title);
          doc.moveDown();
      }

      // Simple Dump of Data for MVP
      if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item: any, index: number) => {
              const text = typeof item === 'string' ? item : JSON.stringify(item);
              doc.text(`${index + 1}. ${text}`);
          });
      } else {
          doc.text(JSON.stringify(data, null, 2));
      }

      doc.end();
    });
  }
}
