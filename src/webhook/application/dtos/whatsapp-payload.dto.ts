import { IsString, IsArray, ValidateNested, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class WhatsAppTextDto {
  @IsString()
  body: string;
}

export class WhatsAppMediaDto {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsString()
  @IsOptional()
  caption?: string; 
}

export class WhatsAppInteractiveReplyDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class WhatsAppInteractiveDto {
  @IsString()
  type: 'list_reply' | 'button_reply';

  @ValidateNested()
  @Type(() => WhatsAppInteractiveReplyDto)
  @IsOptional()
  list_reply?: WhatsAppInteractiveReplyDto;

  @ValidateNested()
  @Type(() => WhatsAppInteractiveReplyDto)
  @IsOptional()
  button_reply?: WhatsAppInteractiveReplyDto;
}

export class WhatsAppMessageDto {
  @IsString()
  from: string;

  @IsString()
  id: string;

  @IsString()
  timestamp: string;

  @IsString()
  type: 'text' | 'image' | 'audio' | 'document' | 'interactive' | 'unknown';

  @ValidateNested()
  @Type(() => WhatsAppTextDto)
  @IsOptional()
  text?: WhatsAppTextDto;

  @ValidateNested()
  @Type(() => WhatsAppMediaDto)
  @IsOptional()
  image?: WhatsAppMediaDto;

  @ValidateNested()
  @Type(() => WhatsAppMediaDto)
  @IsOptional()
  audio?: WhatsAppMediaDto;

  @ValidateNested()
  @Type(() => WhatsAppMediaDto)
  @IsOptional()
  document?: WhatsAppMediaDto;

  @ValidateNested()
  @Type(() => WhatsAppInteractiveDto)
  @IsOptional()
  interactive?: WhatsAppInteractiveDto;
}

export class WhatsAppValueDto {
  @IsString()
  messaging_product: string;

  @ValidateNested({ each: true })
  @Type(() => WhatsAppMessageDto)
  @IsArray()
  @IsOptional()
  messages?: WhatsAppMessageDto[];

  @IsObject()
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
}

export class WhatsAppChangeDto {
  @ValidateNested()
  @Type(() => WhatsAppValueDto)
  value: WhatsAppValueDto;

  @IsString()
  field: string;
}

export class WhatsAppEntryDto {
  @IsString()
  id: string;

  @ValidateNested({ each: true })
  @Type(() => WhatsAppChangeDto)
  @IsArray()
  changes: WhatsAppChangeDto[];
}

export class WhatsAppPayloadDto {
  @IsString()
  object: string;

  @ValidateNested({ each: true })
  @Type(() => WhatsAppEntryDto)
  @IsArray()
  entry: WhatsAppEntryDto[];
}
