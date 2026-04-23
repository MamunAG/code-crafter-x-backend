import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Embellishment } from '../entity/embellishment.entity';

export class CreateEmbellishmentDto extends PartialType(Embellishment) {
  @ApiProperty({ description: 'Embellishment name', example: 'Beads' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Remarks', example: 'Hand-sewn beads for decoration.' })
  @IsOptional()
  remarks: string;

  @ApiProperty({ description: 'Active status', example: 'Y' })
  @IsOptional()
  isActive: string;
}
