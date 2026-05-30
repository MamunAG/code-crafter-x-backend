import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class CreateFabricCostingYarnAdditionalCostDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  gmtCostScopeId: number;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  directCost: number;
}
