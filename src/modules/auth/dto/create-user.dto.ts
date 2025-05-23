// import { ApiProperty } from '@nestjs/swagger';
// import { IsNotEmpty, MinLength } from 'class-validator';

// export class CreateUserDto {
//   @IsNotEmpty()
//   @ApiProperty()
//   name?: string;

//   @IsNotEmpty()
//   @ApiProperty()
//   first_name?: string;

//   @IsNotEmpty()
//   @ApiProperty()
//   last_name?: string;

//   @IsNotEmpty()
//   @ApiProperty()
//   email?: string;

//   @IsNotEmpty()
//   @MinLength(8, { message: 'Password should be minimum 8' })
//   @ApiProperty()
//   password: string;

//   @ApiProperty({
//     type: String,
//     example: 'user',
//   })
//   type?: string;
// }


import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, IsEmail, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsOptional()
  @ApiProperty()
  first_name?: string;

  @IsOptional()
  @ApiProperty()
  last_name?: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsOptional() 
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    example: 'user',
  })
  type?: string;
}


// import { ApiProperty } from '@nestjs/swagger';
// import { IsEmail, IsNotEmpty } from 'class-validator';

// export class CreateUserDto {
//   @IsNotEmpty()
//   @IsEmail()
//   @ApiProperty({
//     description: 'User email address',
//     example: 'user@example.com'
//   })
//   email: string;
// }