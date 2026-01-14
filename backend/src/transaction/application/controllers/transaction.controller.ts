import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CreateTransactionUseCase, CreateTransactionCommand } from '../use-cases/create-transaction.use-case';
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
  constructor(private readonly createTransactionUseCase: CreateTransactionUseCase) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    return this.createTransactionUseCase.execute(dto);
  }
}
