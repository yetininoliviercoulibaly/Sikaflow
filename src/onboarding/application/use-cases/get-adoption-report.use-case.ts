import { Inject, Injectable } from '@nestjs/common';
import { OnboardingProgress } from '../../domain/onboarding-progress.entity';
import { 
  IOnboardingRepository, 
  I_ONBOARDING_REPOSITORY 
} from '../../domain/ports/onboarding.repository.interface';
import { getStepsForRole } from '../../domain/onboarding-step.value-object';

export interface MemberProgress {
  userId: string;
  role: string;
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
  isCompleted: boolean;
}

export interface AdoptionReport {
  organizationId: string;
  totalMembers: number;
  onboardedMembers: number;
  completedMembers: number;
  averageProgress: number;
  memberDetails: MemberProgress[];
}

/**
 * UseCase: Generate an adoption report for an organization.
 * Shows how well team members are progressing through onboarding.
 */
@Injectable()
export class GetAdoptionReportUseCase {
  constructor(
    @Inject(I_ONBOARDING_REPOSITORY)
    private readonly onboardingRepository: IOnboardingRepository,
  ) {}

  async execute(organizationId: string): Promise<AdoptionReport> {
    const progressRecords = await this.onboardingRepository.findByOrganizationId(
      organizationId,
    );

    const memberDetails: MemberProgress[] = progressRecords.map(progress => {
      const steps = getStepsForRole(progress.role);
      const totalSteps = steps.length;
      const completedSteps = progress.completedSteps.length;
      const progressPercent = totalSteps > 0 
        ? Math.round((completedSteps / totalSteps) * 100) 
        : 0;

      return {
        userId: progress.userId,
        role: progress.role,
        completedSteps,
        totalSteps,
        progressPercent,
        isCompleted: progress.completedAt !== null,
      };
    });

    const totalMembers = memberDetails.length;
    const completedMembers = memberDetails.filter(m => m.isCompleted).length;
    const averageProgress = totalMembers > 0
      ? Math.round(memberDetails.reduce((sum, m) => sum + m.progressPercent, 0) / totalMembers)
      : 0;

    return {
      organizationId,
      totalMembers,
      onboardedMembers: totalMembers,
      completedMembers,
      averageProgress,
      memberDetails,
    };
  }
}
