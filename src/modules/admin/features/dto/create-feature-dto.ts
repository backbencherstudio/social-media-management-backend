import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiPropertyOptional({
    example: 'feat7',
    description: 'Name of the feature',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Status of the feature (1 = active, 0 = inactive)',
  })
  @IsOptional()
  @IsInt()
  status?: number;
}
