import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { IPdfGeneratorService } from '../domain/ports/pdf-generator-service.interface';

@Injectable()
export class PdfGeneratorServiceImpl implements IPdfGeneratorService {
  async generateReportPdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', (err) => {
          reject(err);
        });

      // Colors
      const primaryColor = '#FF8C00'; // SikaFlow Orange
      const incomeColor = '#28A745'; 
      const expenseColor = '#DC3545';
      const textColor = '#333333';
      const mutedColor = '#777777';

      // 1. Header Area
      doc.rect(0, 0, 612, 80).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('SikaFlow Flash Report', 40, 30);
      
      doc.fillColor(textColor).fontSize(10).font('Helvetica').text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 400, 35, { align: 'right' });
      doc.moveDown(4);

      // 2. Summary Section
      if (data.summary) {
          const { totalIncome, totalExpense, netChange, currency } = data.summary;
          
          doc.fontSize(16).font('Helvetica-Bold').text('Résumé Financier', 40);
          doc.moveDown(0.5);

          // Summary Boxes Logic (Drawing rectangles and text)
          const boxWidth = 160;
          const startY = doc.y;

          // Income Box
          doc.rect(40, startY, boxWidth, 60).lineWidth(1).strokeColor('#EEEEEE').stroke();
          doc.fillColor(incomeColor).fontSize(10).font('Helvetica-Bold').text('REVENUS', 50, startY + 10);
          doc.fillColor(textColor).fontSize(14).text(`${totalIncome.toLocaleString()} ${currency}`, 50, startY + 25);

          // Expense Box
          doc.rect(40 + boxWidth + 15, startY, boxWidth, 60).stroke();
          doc.fillColor(expenseColor).fontSize(10).font('Helvetica-Bold').text('DÉPENSES', 50 + boxWidth + 15, startY + 10);
          doc.fillColor(textColor).fontSize(14).text(`${totalExpense.toLocaleString()} ${currency}`, 50 + boxWidth + 15, startY + 25);

          // Net Box
          doc.rect(40 + (boxWidth + 15) * 2, startY, boxWidth, 60).stroke();
          doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('SOLDE NET', 50 + (boxWidth + 15) * 2, startY + 10);
          doc.fillColor(textColor).fontSize(14).text(`${netChange.toLocaleString()} ${currency}`, 50 + (boxWidth + 15) * 2, startY + 25);

          doc.moveDown(5);
      }

      // 3. Detailed Items
      doc.fillColor(textColor).fontSize(16).font('Helvetica-Bold').text('Détails des Opérations', 40);
      doc.moveDown(1);

      if (data.items && Array.isArray(data.items)) {
          let currentY = doc.y;
          
          data.items.forEach((item: any) => {
              if (currentY > 700) { doc.addPage(); currentY = 50; }

              // Row background for alternate items
              // doc.rect(40, currentY - 5, 532, 40).fill('#FAFAFA'); 

              const color = item.type === 'REVENU' ? incomeColor : (item.type === 'DÉPENSE' ? expenseColor : mutedColor);
              
              // Type Indicator
              doc.rect(40, currentY, 4, 30).fill(color);
              
              doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text(item.description || 'Sans description', 55, currentY);
              
              if (item.amount !== undefined) {
                  doc.fillColor(color).fontSize(11).text(`${item.type === 'DÉPENSE' ? '-' : '+'}${item.amount} ${item.currency}`, 400, currentY, { align: 'right', width: 150 });
              }

              doc.fillColor(mutedColor).fontSize(9).font('Helvetica').text(
                  item.date ? new Date(item.date).toLocaleString('fr-FR') : '', 
                  55, currentY + 15
              );

              currentY += 45;
              doc.moveTo(40, currentY - 5).lineTo(572, currentY - 5).strokeColor('#EEEEEE').lineWidth(0.5).stroke();
          });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
    });
  }
}
