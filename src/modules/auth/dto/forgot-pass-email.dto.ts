import { IsEmail, IsNotEmpty } from 'class-validator';  
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The email address to reset the password for',
    example: 'user@example.com',
  })
  email: string;
}
