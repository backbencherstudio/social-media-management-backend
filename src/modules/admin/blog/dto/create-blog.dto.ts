import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { CreateBlogContentDto } from './create-blog-content.dto';

export class CreateBlogDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  status?:boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];


  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];


  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlogContentDto)
  @IsOptional()
  contents?: CreateBlogContentDto[];
}
