import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'new media',
    description: 'The display name of the category',
  })
  name: string;

  @ApiProperty({
    example: 'new-media',
    description: 'Slug (URL-friendly identifier) for the category',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Status of the category (1 = active, 0 = inactive)',
  })
  status?: number;
}
