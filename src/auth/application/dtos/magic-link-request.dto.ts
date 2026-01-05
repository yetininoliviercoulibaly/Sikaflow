import { IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MagicLinkRequestDto {
  @ApiProperty({ example: '+33612345678', description: 'User phone number' })
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;
}
