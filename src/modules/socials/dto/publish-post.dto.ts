import { IsString, IsOptional, IsArray } from 'class-validator';

export class PublishPostDto {
  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @IsArray()
  @IsOptional()
  mediaFiles?: Array<{
    name: string;
    type: string;
    file_path: string;
  }>;
} 