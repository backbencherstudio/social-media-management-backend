import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateClientQuestionnaireDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  business_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  business_website?: string;

  // Include all other fields here as in the Create DTO

  @IsOptional()
  @IsArray()
  @ApiProperty({
    description: 'List of social media goals (referencing SocialMediaGoal ids)',
    type: [Object],
  })
  social_media_goals?: { id: string }[];
}
