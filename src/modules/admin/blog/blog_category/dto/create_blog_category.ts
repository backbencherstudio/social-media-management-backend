import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateBlogCategoryDto {
  @IsString()
  @ApiProperty({
    example: 'Social Media Marketing',
    description: 'Name of the blog category',
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'Status of the category (1 = active, 0 = inactive)',
    required: false,
  })
  status?: number;
}
