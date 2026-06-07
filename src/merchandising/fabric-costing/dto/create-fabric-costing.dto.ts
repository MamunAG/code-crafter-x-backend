import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateFabricCostingCommonProcessDto } from './create-fabric-costing-common-process.dto';
import { CreateFabricCostingYarnDto } from './create-fabric-costing-yarn.dto';

export class CreateFabricCostingDto {
  @ApiPropertyOptional({ example: 'material-uuid' })
  @IsOptional()
  @IsString()
  fabricId?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  qty?: number;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  finishedFabricCost?: number;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  unitId?: number | null;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  currencyId: number;

  @ApiPropertyOptional({ example: 'Main fabric costing' })
  @IsOptional()
  @IsString()
  costName?: string | null;

  @ApiPropertyOptional({ type: () => [CreateFabricCostingYarnDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFabricCostingYarnDto)
  yarns?: CreateFabricCostingYarnDto[];

  @ApiPropertyOptional({ type: () => [CreateFabricCostingCommonProcessDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFabricCostingCommonProcessDto)
  commonProcesses?: CreateFabricCostingCommonProcessDto[];
}
