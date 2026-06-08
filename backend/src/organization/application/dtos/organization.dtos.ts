import { IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsPhoneNumber, Matches } from 'class-validator';
import { UserRole } from '../../domain/organization-member.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'My Event Corp', description: 'Name of the organization' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'uuid-of-owner', description: 'User ID of the owner' })
  @IsOptional()
  @IsUUID()
  @IsNotEmpty()
  ownerId?: string;

  @ApiProperty({ required: false, example: '33612345678', description: 'Phone number of the owner if ID not known' })
  @IsOptional()
  @IsPhoneNumber()
  userPhoneNumber?: string;

  @ApiProperty({ required: false, example: 'maquis', description: 'Business type (maquis, restaurant, bar, evenementiel, commerce)' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ required: false, example: '123456789', description: 'Telegram user ID to link to the user account' })
  @IsOptional()
  @Matches(/^\d{1,20}$/, { message: 'telegramUserId must be a numeric string' })
  telegramUserId?: string;
}

export class SwitchOrganizationDto {
  @ApiProperty({ example: '+22501234567', description: 'Phone number or Telegram user ID of the user' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({ required: false, example: 'uuid-of-org', description: 'Target organization ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({ required: false, example: 'My Event Corp', description: 'Target organization name (fuzzy match)' })
  @IsOptional()
  @IsString()
  organizationName?: string;
}

export class AddMemberDto {
  @ApiProperty({ example: 'uuid-of-requester', description: 'ID of the admin making the request' })
  @IsNotEmpty()
  @IsUUID()
  requesterId: string; 

  @ApiProperty({ example: '33612345678', description: 'Phone number of member to add' })
  @IsNotEmpty()
  @IsPhoneNumber() 
  targetPhoneNumber: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF, description: 'Role of the new member' })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
