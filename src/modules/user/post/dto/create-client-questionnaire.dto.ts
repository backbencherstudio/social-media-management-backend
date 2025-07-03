import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateClientQuestionnaireDto {
  @ApiProperty()
  @IsString()
  business_name: string;

  @ApiProperty()
  @IsString()
  business_website: string;

  @ApiProperty()
  @IsString()
  business_industry_type: string;

  @ApiProperty()
  @IsString()
  business_person_email: string;

  @ApiProperty()
  @IsString()
  business_email: string;

  @ApiProperty()
  @IsString()
  business_phone: string;

  @ApiProperty()
  @IsString()
  business_description: string;

  @ApiProperty()
  @IsString()
  social_media_challenges: string;

  @ApiProperty()
  @IsString()
  targeted_audience: string;

  @ApiProperty()
  @IsString()
  instagram: string;

  @ApiProperty()
  @IsString()
  twitter_x: string;

  @ApiProperty()
  @IsString()
  facebook: string;

  @ApiProperty()
  @IsString()
  tiktok: string;

  @ApiProperty()
  @IsString()
  linkedin: string;

  @ApiProperty()
  @IsString()
  youtube: string;

  @ApiProperty()
  @IsString()
  brand_personality_preferences: string;

  @ApiProperty()
  @IsString()
  primary_typography: string;

  @ApiProperty()
  @IsString()
  secondary_typography: string;

  @ApiProperty()
  @IsString()
  tertiary_typography: string;

  @ApiProperty()
  @IsString()
  heading_font: string;

  @ApiProperty()
  @IsString()
  sub_heading_font: string;

  @ApiProperty()
  @IsString()
  body_font: string;

  @ApiProperty()
  @IsString()
  hashtags: string;

  @ApiProperty()
  @IsString()
  keywords_phrases: string;

  @ApiProperty()
  @IsString()
  preferences_special_request: string;

  @ApiProperty()
  @IsString()
  preferences_campaign_upcoming: string;

  @IsOptional()
  @IsArray()
  @ApiProperty({
    description: 'List of social media goals (referencing SocialMediaGoal ids)',
    type: [String],
  })
  social_media_goals?: string[];
}
