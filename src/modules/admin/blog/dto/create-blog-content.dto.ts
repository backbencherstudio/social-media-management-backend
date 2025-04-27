import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateBlogFileDto } from './create-blog-file.dto';

export enum ContentType {
  TEXT  = 'text',
  MEDIA = 'media',
}

export class CreateBlogContentDto {
  @IsEnum(ContentType)
  contentType: ContentType;

 
  @IsString()
  @IsOptional()
  content?: string;

  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlogFileDto)
  @IsOptional()
  files?: CreateBlogFileDto[];
}
