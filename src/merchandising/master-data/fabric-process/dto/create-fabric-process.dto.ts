import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { FabricProcess, FabricProcessStage } from '../entity/fabric-process.entity';

export class CreateFabricProcessDto extends PartialType(FabricProcess) {
  @ApiProperty({ description: 'Fabric process name', example: 'Dyeing' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Production stage', enum: FabricProcessStage, required: false, default: FabricProcessStage.GREY_TO_FINISHED })
  @IsEnum(FabricProcessStage)
  @IsOptional()
  stage?: FabricProcessStage;

  @ApiProperty({ description: 'Display and calculation order', required: false, default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
