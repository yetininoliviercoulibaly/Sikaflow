import { Controller, Post, Get, Patch, Body, Query, Param, BadRequestException, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { AddDebtUseCase } from '../use-cases/add-debt.use-case';
import { GetDebtsListUseCase } from '../use-cases/get-debts-list.use-case';
import { SettleDebtUseCase } from '../use-cases/settle-debt.use-case';
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

class SettleDebtDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}

@Controller('debts')
@UseGuards(ApiKeyGuard)
export class DebtController {
  constructor(
    private readonly addDebtUseCase: AddDebtUseCase,
    private readonly getDebtsListUseCase: GetDebtsListUseCase,
    private readonly settleDebtUseCase: SettleDebtUseCase,
  ) {}

  @Get()
  async list(@Query('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) throw new BadRequestException('phoneNumber query param is required');
    return this.getDebtsListUseCase.execute({ phoneNumber });
  }

  @Patch(':shortId/settle')
  async settle(@Param('shortId') shortId: string, @Body() dto: SettleDebtDto) {
    return this.settleDebtUseCase.execute({ phoneNumber: dto.phoneNumber, shortId, amount: dto.amount });
  }

  @Post()
  async create(@Body() dto: CreateDebtDto) {
    return this.addDebtUseCase.execute(dto);
  }
}
