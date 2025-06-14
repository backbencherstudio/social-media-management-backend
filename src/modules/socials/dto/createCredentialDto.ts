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
}
