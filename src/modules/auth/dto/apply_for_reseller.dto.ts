import { ArrayNotEmpty, IsArray, IsNumber, IsString } from "class-validator";

export class ResellerApplicationDto {
    @IsString()
    full_name: string;

    @IsString()
    user_email: string;

    @IsNumber()
    phone_number: number;

    @IsString()
    location: string;

    @IsString()
    position: string;

    @IsNumber()
    experience: number;

    @IsString()
    cover_letter: string;

    @IsString()
    portfolio: string;

    @IsArray()               // Validate that skills is an array
    @ArrayNotEmpty()         // Ensure the array is not empty
    @IsString({ each: true }) // Validate that each item in the array is a string
    skills: string[];
  }
  