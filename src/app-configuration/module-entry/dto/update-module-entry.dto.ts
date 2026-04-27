import { PartialType } from '@nestjs/swagger';
import { CreateModuleEntryDto } from './create-module-entry.dto';

export class UpdateModuleEntryDto extends PartialType(CreateModuleEntryDto) {}
