import { Controller, Post, Get, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { CreateTransactionUseCase, CreateTransactionCommand } from '../use-cases/create-transaction.use-case';
import { GetTransactionsSummaryUseCase } from '../use-cases/get-transactions-summary.use-case';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '../../domain/transaction.entity';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';

class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  originMessageId?: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;
}

@Controller('transactions')
@UseGuards(ApiKeyGuard)
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionsSummaryUseCase: GetTransactionsSummaryUseCase,
  ) {}

  @Get()
  async getSummary(
    @Query('phoneNumber') phoneNumber: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    if (!phoneNumber) throw new BadRequestException('phoneNumber query param is required');
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    return this.getTransactionsSummaryUseCase.execute({ phoneNumber, startDate, endDate });
  }

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    return this.createTransactionUseCase.execute(dto);
  }
}
