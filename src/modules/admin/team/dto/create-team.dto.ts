import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateTeamDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  role: string;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
