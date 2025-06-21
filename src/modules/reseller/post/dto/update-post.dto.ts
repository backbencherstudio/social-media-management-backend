import { IsString, IsOptional, IsDate, IsArray, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePostChannelDto {
  @IsString()
  @IsOptional()
  channel_id?: string;
}

export class UpdatePostFileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  file_path?: string;

  @IsString()
  @IsOptional()
  file_alt?: string;

}

export class UpdatePostDto {
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

  @IsNumber()
  @IsIn([0, 1, 2])
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsArray()
  @Type(() => UpdatePostChannelDto)
  @IsOptional()
  post_channels?: {
    create?: UpdatePostChannelDto[];
    update?: { where: { id: string }; data: UpdatePostChannelDto }[];
    delete?: { id: string }[];
  };

  @IsArray()
  @Type(() => UpdatePostFileDto)
  @IsOptional()
  post_files?: {
    create?: UpdatePostFileDto[];
    update?: { where: { id: string }; data: UpdatePostFileDto }[];
    delete?: { id: string }[];
  };
}
