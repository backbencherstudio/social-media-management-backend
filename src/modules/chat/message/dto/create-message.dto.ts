import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'ID of the receiver (User)' })
  receiver_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'ID of the conversation' })
  conversation_id: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Text message content', required: false })
  message?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'ID of the attachment (if any)', required: false })
  attachment_id?: string;
}
