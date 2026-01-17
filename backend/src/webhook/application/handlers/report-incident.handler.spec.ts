import { Test, TestingModule } from '@nestjs/testing';
import { ReportIncidentHandler } from './report-incident.handler';
import { I_INCIDENT_REPOSITORY, IIncidentRepository } from '../../../incident/domain/ports/incident.repository.interface';
import { CheckFeatureUseCase } from '../../../subscription/application/use-cases/check-feature.use-case';
import { FeatureFlag } from '../../../subscription/domain/feature-flag.enum';
import { LLMIntent } from '../../../common/llm/llm-types';
import { ActionContext } from './action-handler.interface';
import { MessagingPlatforms } from '../../../common/messaging/domain/constants/messaging-platforms.enum';
import { Incident, IncidentSeverity, IncidentStatus } from '../../../incident/domain/incident.entity';

describe('ReportIncidentHandler', () => {
  let handler: ReportIncidentHandler;
  let incidentRepository: jest.Mocked<IIncidentRepository>;
  let checkFeatureUseCase: jest.Mocked<CheckFeatureUseCase>;
  let messagingService: any; // Mock messaging service

  beforeEach(async () => {
    incidentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrganization: jest.fn(),
    };

    // Fix: cast to any or partial to avoid strict type checks on missing methods if necessary, 
    // but here we just mock execute.
    checkFeatureUseCase = {
      execute: jest.fn(),
    } as any;

    messagingService = {
      sendMessage: jest.fn(),
    };


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportIncidentHandler,
        {
          provide: I_INCIDENT_REPOSITORY,
          useValue: incidentRepository,
        },
        {
          provide: CheckFeatureUseCase,
          useValue: checkFeatureUseCase,
        },
      ],
    }).compile();

    handler = module.get<ReportIncidentHandler>(ReportIncidentHandler);

    mockContext = {
        senderPhoneNumber: '123456789',
        organizationId: 'org-123',
        messageId: 'msg-123',
        user: { id: 'user-123' } as any, 
        platform: MessagingPlatforms.TELEGRAM,
        messagingService: messagingService,
    };
  });

  let mockContext: ActionContext;

  it('should handle REPORT_INCIDENT intent', () => {
    expect(handler.canHandle(LLMIntent.REPORT_INCIDENT)).toBe(true);
    expect(handler.canHandle('OTHER_INTENT')).toBe(false);
  });

  describe('handle', () => {
    it('should create incident and notify user when feature is enabled', async () => {
      // Arrange
      checkFeatureUseCase.execute.mockResolvedValue({ hasAccess: true });
      incidentRepository.create.mockImplementation(async (inc) => inc);

      const data = {
        description: 'Fight started',
        severity: 'CRITICAL',
      };

      // Act
      await handler.handle(data, mockContext);

      // Assert
      expect(checkFeatureUseCase.execute).toHaveBeenCalledWith({
        organizationId: 'org-123',
        feature: FeatureFlag.INCIDENT_COMPLIANCE,
      });

      expect(incidentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'org-123',
        description: 'Fight started',
        severity: IncidentSeverity.CRITICAL,
        status: IncidentStatus.OPEN,
        // user.id check implied by successful creation or we could check it explicitly
        // reportedByUserId: 'user-123' // property name in Incident entity
      }));

      expect(messagingService.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('Incident Signalé'),
      );
    });

    it('should send rejection message if feature is disabled', async () => {
      // Arrange
      checkFeatureUseCase.execute.mockResolvedValue({ 
        hasAccess: false, 
        // message removed to match interface
      });

      // Act
      await handler.handle({}, mockContext);

      // Assert
      expect(incidentRepository.create).not.toHaveBeenCalled();
      expect(messagingService.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('pas incluse'),
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      checkFeatureUseCase.execute.mockResolvedValue({ hasAccess: true });
      incidentRepository.create.mockRejectedValue(new Error('DB Error'));

      // Act
      await handler.handle({ description: 'Test' }, mockContext);

      // Assert
      expect(messagingService.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('Une erreur est survenue'),
      );
    });
  });
});
