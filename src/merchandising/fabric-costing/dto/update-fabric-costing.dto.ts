import { PartialType } from '@nestjs/swagger';
import { CreateFabricCostingDto } from './create-fabric-costing.dto';

export class UpdateFabricCostingDto extends PartialType(CreateFabricCostingDto) {}
