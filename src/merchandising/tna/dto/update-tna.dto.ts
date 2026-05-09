import { PartialType } from '@nestjs/swagger';
import { CreateTnaDto } from './create-tna.dto';

export class UpdateTnaDto extends PartialType(CreateTnaDto) {}
