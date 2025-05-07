import { IsEmail, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class ManageUserRoleDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsIn([0, 1])
  status?: number; // 0 = Inactive, 1 = Active
}
