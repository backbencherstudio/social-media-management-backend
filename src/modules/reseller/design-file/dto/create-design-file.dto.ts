import { IsString, IsOptional, IsArray } from 'class-validator';

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
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  files?: CreateDesignFileAssetDto[];
}