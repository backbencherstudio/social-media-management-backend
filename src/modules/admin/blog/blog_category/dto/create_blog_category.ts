import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateBlogCategoryDto {
  @ApiProperty({
    example: 'Social Media Marketing',
    description: 'Name of the blog category',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'social-media-marketing',
    description: 'Slug for the category (URL-friendly string)',
  })
  @IsString()
  slug: string;

  @ApiProperty({
    example: 1,
    description: 'Status of the category (1 = active, 0 = inactive)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  status?: number;
}
