export interface IPdfGeneratorService {
  generateReportPdf(data: any): Promise<Buffer>;
}

export const PDF_GENERATOR_SERVICE = 'PDF_GENERATOR_SERVICE';
