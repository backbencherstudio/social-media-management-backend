// import { ApiProperty } from '@nestjs/swagger';
// import { IsOptional } from 'class-validator';

// export class UpdateUserDto {
//   @IsOptional()
//   @ApiProperty({
//     description: 'Name of the user',
//     example: 'John Doe',
//   })
//   name?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'First name of the user',
//     example: 'John',
//   })
//   first_name?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Last name of the user',
//     example: 'Doe',
//   })
//   last_name?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Email of the user',
//     example: 'john.doe@example.com',
//   })
//   email?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Password of the user',
//     example: 'newpassword123',
//   })
//   password?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'User type',
//     example: 'admin',
//   })
//   type?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Country',
//     example: 'Nigeria',
//   })
//   country?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'State',
//     example: 'Lagos',
//   })
//   state?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'City',
//     example: 'Lagos',
//   })
//   city?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Local government area',
//     example: 'Lagos Mainland',
//   })
//   local_government?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Zip code',
//     example: '123456',
//   })
//   zip_code?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Phone number',
//     example: '+234 123 456 789',
//   })
//   phone_number?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Address of the user',
//     example: '123, Main Street, Lagos',
//   })
//   address?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Gender of the user',
//     example: 'male',
//   })
//   gender?: string;

//   @IsOptional()
//   @ApiProperty({
//     description: 'Date of birth',
//     example: '1990-01-01',
//   })
//   date_of_birth?: string;
// }



import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  name?: string;

  @IsOptional()
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  first_name?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  last_name?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Email of the user',
    example: 'john.doe@example.com',
  })
  email?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Password of the user',
    example: 'newpassword123',
  })
  password?: string;

  @IsOptional()
  @ApiProperty({
    description: 'User type',
    example: 'admin',
  })
  type?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Country',
    example: 'Nigeria',
  })
  country?: string;

  @IsOptional()
  @ApiProperty({
    description: 'State',
    example: 'Lagos',
  })
  state?: string;

  @IsOptional()
  @ApiProperty({
    description: 'City',
    example: 'Lagos',
  })
  city?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Local government area',
    example: 'Lagos Mainland',
  })
  local_government?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Zip code',
    example: '123456',
  })
  zip_code?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Phone number',
    example: '+234 123 456 789',
  })
  phone_number?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Address of the user',
    example: '123, Main Street, Lagos',
  })
  address?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Gender of the user',
    example: 'male',
  })
  gender?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
  })
  date_of_birth?: string;

  // ✅ New Fields
  @IsOptional()
  @ApiProperty({
    description: 'User location (optional)',
    example: 'Remote or Lagos',
  })
  location?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Current position or job title',
    example: 'Frontend Developer',
  })
  position?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: 'Years of experience',
    example: 3,
  })
  experience_year?: number;

  @IsOptional()
  @ApiProperty({
    description: 'Portfolio URL',
    example: 'https://myportfolio.com',
  })
  portfolio_url?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Skills (comma separated)',
    example: 'React, TypeScript, NestJS',
  })
  skills?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Cover letter content or summary',
    example: 'I am passionate about building scalable apps...',
  })
  cover_letter?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Whether user agreed to terms',
    example: true,
  })
  agreed_terms?: boolean;
}
