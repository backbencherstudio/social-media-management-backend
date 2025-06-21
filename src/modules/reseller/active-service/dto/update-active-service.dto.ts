import { PartialType } from '@nestjs/swagger';
import { CreateActiveServiceDto } from './create-active-service.dto';

export class UpdateActiveServiceDto extends PartialType(CreateActiveServiceDto) {}
