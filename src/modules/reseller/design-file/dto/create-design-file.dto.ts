import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateDesignFileAssetDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  file_path: string;

  @IsOptional()
  size?: number;
}

export class CreateDesignFileDto {
  @IsString()
  content?: string;

  @IsNumber()
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  task_id: string

  @IsArray()
  @IsOptional()
  files?: CreateDesignFileAssetDto[];
}