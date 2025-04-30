import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsDefined,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TierDto {
  @ApiProperty({ example: 10, description: 'Maximum number of posts allowed in this tier' })
  @IsDefined()
  @IsNumber()
  max_post: number;

  @ApiProperty({ example: 99, description: 'Price of this tier' })
  @IsDefined()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 'Starter Tier', description: 'Optional name for the tier' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateServiceDto {
  @ApiProperty({ example: 'My Service 555589aaaaaaaaa' })
  @IsDefined()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Grow fast online' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ example: 'clu1e9x0e0001tx08bd8y91gc', description: 'The category ID this service belongs to' })
  @IsDefined()
  @IsString()
  category_id: string;

  @ApiPropertyOptional({
    type: [TierDto],
    description: 'Tier-based pricing options',
    example: [
      { max_post: 10, price: 99 },
      { max_post: 20, price: 149 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierDto)
  tiers: TierDto[] = [];

  @ApiProperty({ example: 'Instagram', description: 'Primary platform for this service' })
  @IsDefined()
  @IsString()
  primary_platform: string;

  @ApiProperty({
    type: [String],
    example: ['feat1', 'feat3', 'feat4'],
    description: 'Core features offered in the service',
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Twitter', 'LinkedIn'],
    description: 'Extra platforms supported',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extra_platforms: string[] = [];

  @ApiPropertyOptional({ example: 10, description: 'Extra cost for additional platforms' })
  @IsOptional()
  @IsNumber()
  extra_platformPrice: number;
}
