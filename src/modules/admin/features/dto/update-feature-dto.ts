// src/feature/dto/update-feature.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateFeatureDto } from './create-feature-dto';

export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {}
