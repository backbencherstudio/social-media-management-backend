import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleByEmailDto {
  @IsEmail()
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the user to assign the role to',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'role_admin_id',
    description: 'ID of the role to assign',
  })
  roleId: string;
}
