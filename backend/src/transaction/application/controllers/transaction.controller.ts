import { Controller, Post, Get, Patch, Body, Query, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { CreateTransactionUseCase, CreateTransactionCommand } from '../use-cases/create-transaction.use-case';
import { GetTransactionsSummaryUseCase } from '../use-cases/get-transactions-summary.use-case';
import { GetTransactionsListUseCase } from '../use-cases/get-transactions-list.use-case';
import { UpdateTransactionCategoryUseCase } from '../use-cases/update-transaction-category.use-case';
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

class UpdateCategoryDto {
  @IsNotEmpty()
  @IsString()
  category: string;
}

@Controller('transactions')
@UseGuards(ApiKeyGuard)
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionsSummaryUseCase: GetTransactionsSummaryUseCase,
    private readonly getTransactionsListUseCase: GetTransactionsListUseCase,
    private readonly updateTransactionCategoryUseCase: UpdateTransactionCategoryUseCase,
  ) {}

  @Get()
  async get(
    @Query('phoneNumber') phoneNumber: string,
    @Query('summary') summary?: string,
    @Query('limit') limitStr?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    if (!phoneNumber) throw new BadRequestException('phoneNumber query param is required');

    if (summary === 'true') {
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;
      return this.getTransactionsSummaryUseCase.execute({ phoneNumber, startDate, endDate });
    }

    const parsed = parseInt(limitStr ?? '', 10);
    const limit = isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
    return this.getTransactionsListUseCase.execute({ phoneNumber, limit });
  }

  @Patch(':id/category')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.updateTransactionCategoryUseCase.execute({ transactionId: id, category: dto.category });
  }

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    return this.createTransactionUseCase.execute(dto);
  }
}
