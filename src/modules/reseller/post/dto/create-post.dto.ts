import { IsString, IsOptional, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostChannelDto {
  @IsString()
  channel_id: string;
}

export class CreatePostFileDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  file_path: string;

  @IsString()
  @IsOptional()
  file_alt?: string;
}

export class CreatePostDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  schedule_at?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @IsString()
  @IsOptional()
  task_id?: string;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsArray()
  @Type(() => CreatePostChannelDto)
  @IsOptional()
  post_channels?: CreatePostChannelDto[];

  @IsArray()
  @Type(() => CreatePostFileDto)
  @IsOptional()
  post_files?: CreatePostFileDto[];
}
