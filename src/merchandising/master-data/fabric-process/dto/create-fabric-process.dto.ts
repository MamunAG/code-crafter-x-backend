import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { FabricProcess } from '../entity/fabric-process.entity';

export class CreateFabricProcessDto extends PartialType(FabricProcess) {
  @ApiProperty({ description: 'Fabric process name', example: 'Dyeing' })
  @IsNotEmpty()
  name: string;
}
