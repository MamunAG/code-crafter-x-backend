import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateFabricCostingYarnProcessDto } from './create-fabric-costing-yarn-process.dto';
import { CreateFabricCostingYarnAdditionalCostDto } from './create-fabric-costing-yarn-additional-cost.dto';

export class CreateFabricCostingYarnDto {
  @ApiPropertyOptional({ example: 'material-uuid' })
  @IsOptional()
  @IsString()
  yarnId?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  percentagePerUnitFabric?: number;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  yarnPricePerUnit?: number;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  totalYarnPrice?: number;

  @ApiPropertyOptional({ type: () => [CreateFabricCostingYarnProcessDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFabricCostingYarnProcessDto)
  yarnWiseProcesses?: CreateFabricCostingYarnProcessDto[];

  @ApiPropertyOptional({ type: () => [CreateFabricCostingYarnAdditionalCostDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFabricCostingYarnAdditionalCostDto)
  additionalMaterialCosts?: CreateFabricCostingYarnAdditionalCostDto[];
}
