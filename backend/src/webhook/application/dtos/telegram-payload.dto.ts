import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Telegram User object
 * https://core.telegram.org/bots/api#user
 */
export class TelegramUserDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  is_bot: boolean;

  @IsString()
  first_name: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  language_code?: string;
}

/**
 * Telegram Chat object
 * https://core.telegram.org/bots/api#chat
 */
export class TelegramChatDto {
  @IsNumber()
  id: number;

  @IsString()
  type: 'private' | 'group' | 'supergroup' | 'channel';

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;
}

/**
 * Telegram PhotoSize object
 * https://core.telegram.org/bots/api#photosize
 */
export class TelegramPhotoSizeDto {
  @IsString()
  file_id: string;

  @IsString()
  file_unique_id: string;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsNumber()
  @IsOptional()
  file_size?: number;
}

/**
 * Telegram Document object
 * https://core.telegram.org/bots/api#document
 */
export class TelegramDocumentDto {
  @IsString()
  file_id: string;

  @IsString()
  file_unique_id: string;

  @IsString()
  @IsOptional()
  file_name?: string;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsNumber()
  @IsOptional()
  file_size?: number;
}

/**
 * Telegram Voice object
 * https://core.telegram.org/bots/api#voice
 */
export class TelegramVoiceDto {
  @IsString()
  file_id: string;

  @IsString()
  file_unique_id: string;

  @IsNumber()
  duration: number;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsNumber()
  @IsOptional()
  file_size?: number;
}

/**
 * Telegram Audio object
 * https://core.telegram.org/bots/api#audio
 */
export class TelegramAudioDto {
  @IsString()
  file_id: string;

  @IsString()
  file_unique_id: string;

  @IsNumber()
  duration: number;

  @IsString()
  @IsOptional()
  performer?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsNumber()
  @IsOptional()
  file_size?: number;
}

/**
 * Telegram Message object
 * https://core.telegram.org/bots/api#message
 */
export class TelegramMessageDto {
  @IsNumber()
  message_id: number;

  @ValidateNested()
  @Type(() => TelegramUserDto)
  @IsOptional()
  from?: TelegramUserDto;

  @ValidateNested()
  @Type(() => TelegramChatDto)
  chat: TelegramChatDto;

  @IsNumber()
  date: number;

  @IsString()
  @IsOptional()
  text?: string;

  @ValidateNested({ each: true })
  @Type(() => TelegramPhotoSizeDto)
  @IsArray()
  @IsOptional()
  photo?: TelegramPhotoSizeDto[];

  @ValidateNested()
  @Type(() => TelegramDocumentDto)
  @IsOptional()
  document?: TelegramDocumentDto;

  @ValidateNested()
  @Type(() => TelegramVoiceDto)
  @IsOptional()
  voice?: TelegramVoiceDto;

  @ValidateNested()
  @Type(() => TelegramAudioDto)
  @IsOptional()
  audio?: TelegramAudioDto;

  @IsString()
  @IsOptional()
  caption?: string;
}

/**
 * Telegram CallbackQuery object
 * https://core.telegram.org/bots/api#callbackquery
 */
export class TelegramCallbackQueryDto {
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => TelegramUserDto)
  from: TelegramUserDto;

  @ValidateNested()
  @Type(() => TelegramMessageDto)
  @IsOptional()
  message?: TelegramMessageDto;

  @IsString()
  chat_instance: string;

  @IsString()
  @IsOptional()
  data?: string;
}

/**
 * Telegram Update object
 * https://core.telegram.org/bots/api#update
 */
export class TelegramUpdateDto {
  @IsNumber()
  update_id: number;

  @ValidateNested()
  @Type(() => TelegramMessageDto)
  @IsOptional()
  message?: TelegramMessageDto;

  @ValidateNested()
  @Type(() => TelegramCallbackQueryDto)
  @IsOptional()
  callback_query?: TelegramCallbackQueryDto;
}
