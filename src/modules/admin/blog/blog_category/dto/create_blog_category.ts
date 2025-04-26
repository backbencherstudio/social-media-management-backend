import { ApiProperty } from '@nestjs/swagger';

export class CreateBlogCategoryDto {
  @ApiProperty({
    example: 'Social Media Marketing',
    description: 'Name of the blog category',
  })
  name: string;

  @ApiProperty({
    example: 'social-media-marketing',
    description: 'Slug for the category (URL-friendly string, usually lowercase with dashes)',
  })
  slug: string;

  @ApiProperty({
    example: 1,
    description: 'Status of the category (1 = active, 0 = inactive)',
    required: false,
  })
  status?: number;
}
