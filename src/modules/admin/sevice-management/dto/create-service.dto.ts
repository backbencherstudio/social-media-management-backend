import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TierDto {
  @IsDefined()
  @IsNumber()
  max_post: number;

  @IsDefined()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateServiceDto {
  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsDefined()
  @IsString()
  category_id: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierDto)
  tiers: TierDto[] = [];

  @IsDefined()
  @IsString()
  primaryPlatform: string;

  features: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraPlatforms: string[] = [];
  extraPlatformPrice: number;
}
