import { IsEmail, IsOptional, IsBoolean, IsString } from 'class-validator';

export class UpdateUserByEmailDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  roleId?: string; // Single role
}
