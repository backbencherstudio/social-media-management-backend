import { PartialType } from '@nestjs/swagger';
import { CreateResellerDto } from './create-reseller.dto';

export class UpdateResellerDto extends PartialType(CreateResellerDto) {}
