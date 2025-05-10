import {IsEmail, IsString } from 'class-validator';

export class CreateEmailDto {
  @IsString()
  type?: string;

  @IsString()
  subject?: string;

  @IsString()
  body?: string;

  @IsString()
  @IsEmail()
  recipient_emails: string;
}
