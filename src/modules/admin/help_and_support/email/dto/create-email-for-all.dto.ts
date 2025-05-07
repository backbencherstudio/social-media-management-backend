import { IsString } from 'class-validator';

export class CreateEmailForAll {
  @IsString()
  type?: string;

  @IsString()
  subject?: string;

  @IsString()
  body?: string;

}
