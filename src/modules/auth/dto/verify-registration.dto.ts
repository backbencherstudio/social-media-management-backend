import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyRegistrationDto {
  @ApiProperty({
    description: 'Password for registration verification',
    example: 'StrongPassword123',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'The token for registration verification',
    example: 'some-valid-token',
  })
  token: string;
}
