import { PartialType } from '@nestjs/swagger';
import { CreateResellerProfileDto } from './create-reseller_profile.dto';

export class UpdateResellerProfileDto extends PartialType(CreateResellerProfileDto) {}
