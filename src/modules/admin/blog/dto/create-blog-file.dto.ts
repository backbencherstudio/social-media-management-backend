// src/modules/admin/blog/dto/create-blog-file.dto.ts
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateBlogFileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;        // e.g. "image" or "video"

  @IsInt()
  @IsOptional()
  size?: number;        // in bytes

  @IsString()
  @IsOptional()
  filePath?: string;    // where it’s stored (e.g. "/uploads/abc.jpg")

  @IsString()
  @IsOptional()
  fileAlt?: string;     // alt text for images

  @IsInt()
  @IsOptional()
  sortOrder?: number;   // ordering if you have multiple files
}
