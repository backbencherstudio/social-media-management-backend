import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class BlogBlockUpdateInput {
  @ApiPropertyOptional({ example: 'cm9xpmjo00005rejwuy36nxjf' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'Updated block content.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: '/uploads/images/updated-block.jpg' })
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiPropertyOptional({ example: 'text' })
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  sort_order?: number;
}

export class UpdateBlogDto {
  @ApiPropertyOptional({ example: 'Updated Blog Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated blog content.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'html' })
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiPropertyOptional({ example: '/uploads/images/updated-main.jpg' })
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @ApiPropertyOptional({
    example: ['updated', 'tags'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({
    type: [BlogBlockUpdateInput],
    description: 'List of updated content blocks',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogBlockUpdateInput)
  blocks?: BlogBlockUpdateInput[];
}
