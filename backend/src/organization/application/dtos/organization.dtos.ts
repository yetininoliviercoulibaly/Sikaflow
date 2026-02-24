import { IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsPhoneNumber } from 'class-validator';
import { UserRole } from '../../domain/organization-member.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'My Event Corp', description: 'Name of the organization' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'uuid-of-owner', description: 'User ID of the owner' })
  @IsUUID()
  @IsNotEmpty()
  ownerId?: string;

  @ApiProperty({ required: false, example: '33612345678', description: 'Phone number of the owner if ID not known' })
  @IsPhoneNumber()
  userPhoneNumber?: string;

  @ApiProperty({ required: false, example: 'maquis', description: 'Business type (maquis, restaurant, bar, evenementiel, commerce)' })
  @IsOptional()
  @IsString()
  businessType?: string;
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
