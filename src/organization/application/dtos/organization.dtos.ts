import { IsNotEmpty, IsString, IsUUID, IsEnum, IsPhoneNumber } from 'class-validator';
import { UserRole } from '../../domain/organization-member.entity';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty() // Still required for now, or make optional? 
  // Wait, if no ownerId, we need phone. So both can be optional but ValidateIf one exists?
  // User asked for frictionless. If we use this DTO from Controller, we might not have ownerId but have phone.
  // Let's make ownerId optional and add userPhoneNumber.
  // Validation logic: At least one must be present. For now, simple optional is easier to start.
  @IsUUID()
  @IsNotEmpty()
  ownerId?: string;

  @IsPhoneNumber()
  userPhoneNumber?: string;
}

export class AddMemberDto {
  @IsNotEmpty()
  @IsUUID()
  requesterId: string; // Ideally this comes from Auth Guard, but implementing as DTO property for now as per minimal requirements

  @IsNotEmpty()
  @IsPhoneNumber() // Checks generic international format
  targetPhoneNumber: string;

  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
