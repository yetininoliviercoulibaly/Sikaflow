import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { AddDebtUseCase } from '../use-cases/add-debt.use-case';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';

class CreateDebtDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsString()
  contactName: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('debts')
@UseGuards(ApiKeyGuard)
export class DebtController {
  constructor(private readonly addDebtUseCase: AddDebtUseCase) {}

  @Post()
  async create(@Body() dto: CreateDebtDto) {
    return this.addDebtUseCase.execute(dto);
  }
}
