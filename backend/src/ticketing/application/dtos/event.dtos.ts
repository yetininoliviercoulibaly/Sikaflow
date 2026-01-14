
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Concert de Gala' })
  name: string;

  @ApiProperty({ example: '2026-12-31T20:00:00Z' })
  date: string;

  @ApiProperty({ example: 500 })
  totalCapacity: number;

  @ApiProperty({ example: 5000 })
  price: number;
}
