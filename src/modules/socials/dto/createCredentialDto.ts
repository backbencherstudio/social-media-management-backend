import {
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateCredentialDto {
  @IsString()
  provider: string; // e.g., 'facebook', 'instagram', 'linkedin'

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  accessSecret: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  providerAccountId?: string;

  @IsOptional()
  @IsString()
  pageId?: string; // For Facebook pages

  @IsOptional()
  @IsString()
  username?: string; // For Instagram, Twitter, etc.

  @IsOptional()
  @IsString()
  apiKey?: string; // Twitter API key

  @IsOptional()
  @IsString()
  apiSecret?: string; // Twitter API secret
}
