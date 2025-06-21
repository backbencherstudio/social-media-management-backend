import { ApiProperty } from '@nestjs/swagger';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, Validate, IsEmail, IsNotEmpty, IsString, MinLength, IsBoolean } from 'class-validator';

// Custom validation constraint for 'agreed_terms' field
@ValidatorConstraint({ async: false })
class IsAgreedTermsTrue implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    console.log('Validating agreed_terms:', value);  // Debugging line to check value
    return value === true;  // Only valid if the value is exactly `true`
  }
  defaultMessage(args: ValidationArguments) {
    return 'You must agree to the terms and conditions';  // Custom error message
  }
}

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The password of the user (min 8 characters)',
    example: 'StrongPassword123',
  })
  password: string;

  @IsBoolean()
  @IsNotEmpty()
  @Validate(IsAgreedTermsTrue) // Custom validation to ensure agreed_terms is true
  @ApiProperty({
    description: 'Whether the user has agreed to the terms and conditions',
    example: true,
  })
  agreed_terms: boolean;
}
