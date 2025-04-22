import { IsOptional, IsString, IsInt } from 'class-validator';

export class CreateFeatureDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  status?: number;
}
