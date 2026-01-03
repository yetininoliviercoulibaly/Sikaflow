import { IsNotEmpty, IsString, IsUUID, IsEnum, IsPhoneNumber } from 'class-validator';
import { UserRole } from '../../domain/organization-member.entity';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  ownerId: string;
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
