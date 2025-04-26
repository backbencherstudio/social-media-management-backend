import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlogBlockInput {
  @ApiPropertyOptional({ example: 'I am testing.' })
  content?: string;

  @ApiPropertyOptional({ example: '/uploads/images/addedImageForTesting.jpg' })
  cover_image?: string;

  @ApiPropertyOptional({ example: 'added text testing' })
  content_type?: string;

  @ApiPropertyOptional({ example: 1 })
  sort_order?: number;
}

export class CreateBlogDto {
  @ApiProperty({ example: 'Testing blog' })
  title: string;

  @ApiPropertyOptional({ example: 'Testing blog content.' })
  content?: string;

  @ApiPropertyOptional({ example: 'text' })
  content_type?: string;

  @ApiPropertyOptional({ example: '/uploads/images/main picture.jpg' })
  cover_image?: string;

  @ApiPropertyOptional({ example: true })
  is_published?: boolean;

  @ApiPropertyOptional({
    example: ['technology', 'coding', 'Test'],
    type: [String],
  })
  hashtags?: string[];

  @ApiPropertyOptional({
    type: [BlogBlockInput],
    description: 'Array of additional content blocks',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogBlockInput)
  blocks?: BlogBlockInput[];
}
