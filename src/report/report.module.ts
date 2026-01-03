import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Report } from './domain/report.entity';
import { PdfGeneratorServiceImpl } from './infrastructure/pdf-generator.service';
import { PDF_GENERATOR_SERVICE } from './domain/ports/pdf-generator-service.interface';
import { ReportProcessor } from './application/processors/report.processor';
import { WhatsAppModule } from '../common/whatsapp/whatsapp.module';
import { BullModule } from '@nestjs/bullmq';
import { BusinessIntelligenceService } from './application/services/business-intelligence.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Report]),
    WhatsAppModule,
    BullModule.registerQueue({
        name: 'reports',
    }),
  ],
  providers: [
    {
      provide: PDF_GENERATOR_SERVICE,
      useClass: PdfGeneratorServiceImpl,
    },
    ReportProcessor,
    BusinessIntelligenceService,
  ],
  exports: [
    PDF_GENERATOR_SERVICE,
    MikroOrmModule,
    BullModule,
    BusinessIntelligenceService,
  ]
})
export class ReportModule {}
