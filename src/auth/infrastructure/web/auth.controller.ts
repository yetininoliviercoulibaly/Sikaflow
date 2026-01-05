import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequestMagicLinkUseCase } from '../../application/use-cases/request-magic-link.use-case';
import { VerifyMagicLinkUseCase } from '../../application/use-cases/verify-magic-link.use-case';
import { MagicLinkRequestDto } from '../../application/dtos/magic-link-request.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly requestMagicLinkUseCase: RequestMagicLinkUseCase,
    private readonly verifyMagicLinkUseCase: VerifyMagicLinkUseCase,
  ) {}

  @Post('magic-link')
  @ApiOperation({ summary: 'Request a Magic Link via WhatsApp' })
  @ApiResponse({ status: 201, description: 'Link sent if phone number is valid.' })
  async requestMagicLink(@Body() dto: MagicLinkRequestDto): Promise<void> {
    await this.requestMagicLinkUseCase.execute(dto.phoneNumber);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify Magic Link Token' })
  @ApiResponse({ status: 200, description: 'Returns JWT session.' })
  async verifyMagicLink(@Query('token') token: string): Promise<{ accessToken: string }> {
    const jwt = await this.verifyMagicLinkUseCase.execute(token);
    return { accessToken: jwt };
  }
}
