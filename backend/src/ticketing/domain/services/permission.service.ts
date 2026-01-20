import { Injectable } from '@nestjs/common';
import { UserRole } from '../../../organization/domain/organization-member.entity';
import { Event } from '../event.entity';

export interface IPermissionService {
  verifyEventOwnership(event: Event, organizationId: string, userRole?: UserRole): void;
}

export const I_PERMISSION_SERVICE = 'I_PERMISSION_SERVICE';

@Injectable()
export class PermissionService implements IPermissionService {
  verifyEventOwnership(event: Event, organizationId: string, userRole?: UserRole): void {
    if (userRole === UserRole.ADMIN) {
      return;
    }

    if (event.organizationId !== organizationId) {
      throw new Error('Forbidden: You do not own this event');
    }
  }
}
