import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'new media',
    description: 'The display name of the category',
  })
    @IsString()
  name: string;

  @ApiProperty({
    example: 'new-media',
    description: 'Slug (URL-friendly identifier) for the category',
  })
    @IsString()
  slug: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Status of the category (1 = active, 0 = inactive)',
  })
    @IsNumber()
  status?: number;
}
