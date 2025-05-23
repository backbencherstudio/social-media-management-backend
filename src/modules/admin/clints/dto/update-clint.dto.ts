import { PartialType } from '@nestjs/swagger';
import { CreateClintDto } from './create-clint.dto';

export class UpdateClintDto extends PartialType(CreateClintDto) {}
