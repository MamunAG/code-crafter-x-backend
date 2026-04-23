import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterEmbellishmentDto extends PaginationDto {
  @ApiProperty({ description: 'Embellishment name', example: 'Beads', required: false })
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'Remarks', example: 'Hand-sewn beads for decoration.', required: false })
  @IsOptional()
  remarks: string;

  @ApiProperty({ description: 'Active status', example: 'Y', required: false })
  @IsOptional()
  is_active: string;
}
