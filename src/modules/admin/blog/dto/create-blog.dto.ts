import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { CreateBlogContentDto } from './create-blog-content.dto';

export class CreateBlogDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  // attach to existing categories
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  // dynamic list of text/media blocks
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlogContentDto)
  @IsOptional()
  contents?: CreateBlogContentDto[];
}
